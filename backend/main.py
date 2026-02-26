"""
WeaponGuard AI — FastAPI Backend
Serves YOLOv8m weapon detection inference via REST API.
It loads a pre-trained PyTorch model using Ultralytics and exposes endpoints
for detecting weapons.
"""

import io
import base64
import uuid
import os
import sqlite3
import json
import tempfile
import subprocess
import cv2
import hashlib
import hmac
import secrets
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np
from ultralytics import YOLO

# ─── App Setup ────────────────────────────────────────────────
app = FastAPI(
    title="WeaponGuard AI API",
    description="YOLOv8m-based weapon detection inference service with SQLite persistence",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Constants ───────────────────────────────────────────────
IMAGE_TYPES = {"image/jpeg", "image/png", "image/bmp", "image/webp", "image/gif"}
VIDEO_TYPES = {"video/mp4", "video/avi", "video/x-msvideo", "video/quicktime", "video/webm", "video/x-matroska"}
MAX_VIDEO_SECONDS = 20  # Max video duration to process (seconds)

# ─── Database Setup ──────────────────────────────────────────
DB_PATH = os.environ.get("DB_PATH", "weaponguard.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Create table with the full schema
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS detections (
        id TEXT PRIMARY KEY,
        filename TEXT,
        media_type TEXT DEFAULT 'image',
        timestamp TEXT,
        image_width INTEGER,
        image_height INTEGER,
        confidence_threshold REAL,
        total_detections INTEGER,
        weapon_names TEXT,
        detections_json TEXT,
        user_id TEXT
    )
    ''')

    # ── Migration: add columns that older DB versions may be missing ──
    existing_cols = {row[1] for row in cursor.execute("PRAGMA table_info(detections)")}
    migrations = {
        "media_type":   "ALTER TABLE detections ADD COLUMN media_type TEXT DEFAULT 'image'",
        "weapon_names": "ALTER TABLE detections ADD COLUMN weapon_names TEXT",
        "user_id":      "ALTER TABLE detections ADD COLUMN user_id TEXT",
    }
    for col, sql in migrations.items():
        if col not in existing_cols:
            cursor.execute(sql)
            print(f"🔧 DB migration: added column '{col}'")

    # ── Users table ──
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT
    )
    ''')

    conn.commit()
    conn.close()
    print(f"✅ Database initialized at {DB_PATH}")

# ─── Auth Helpers ────────────────────────────────────────
AUTH_SECRET = os.environ.get("AUTH_SECRET", "weaponguard-secret-2026")

def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}{password}{AUTH_SECRET}".encode()).hexdigest()

def make_token(email: str) -> str:
    sig = hmac.new(AUTH_SECRET.encode(), email.encode(), hashlib.sha256).hexdigest()
    payload = base64.b64encode(f"{email}:{sig}".encode()).decode()
    return payload

def verify_token(token: str) -> Optional[str]:
    try:
        decoded = base64.b64decode(token.encode()).decode()
        email, sig = decoded.rsplit(":", 1)
        expected = hmac.new(AUTH_SECRET.encode(), email.encode(), hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, expected):
            return email
    except Exception:
        pass
    return None

class AuthRequest(BaseModel):
    email: str
    password: str

# ─── Auth Endpoints ────────────────────────────────────────
@app.post("/auth/register")
def register(req: AuthRequest):
    email = req.email.strip().lower()
    if not email or not req.password:
        raise HTTPException(status_code=400, detail="Email et mot de passe requis")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    # Check if user already exists
    existing = cursor.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="Ce compte existe déjà. Veuillez vous connecter.")
    salt = secrets.token_hex(16)
    pwd_hash = hash_password(req.password, salt)
    user_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO users (id, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, email, pwd_hash, salt, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    token = make_token(email)
    print(f"✅ New user registered: {email}")
    return {"access_token": token, "email": email, "message": "Compte créé avec succès"}

@app.post("/auth/login")
def login(req: AuthRequest):
    email = req.email.strip().lower()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    user = cursor.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    pwd_hash = hash_password(req.password, user["salt"])
    if not hmac.compare_digest(pwd_hash, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = make_token(email)
    print(f"✅ User logged in: {email}")
    return {"access_token": token, "email": email}


# ─── Model Loading ───────────────────────────────────────────
MODEL_PATH = os.environ.get("MODEL_PATH", "/app/model/best.pt")
model: YOLO | None = None

def get_model() -> YOLO:
    global model
    if model is None:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(f"Model file not found at {MODEL_PATH}")
        model = YOLO(MODEL_PATH)
        model.to('cpu')  # Force CPU to avoid CUDA kernel errors
        print(f"✅ Model loaded from {MODEL_PATH} (CPU)")
        print(f"📋 Classes: {model.names}")
    return model

@app.on_event("startup")
async def startup_event():
    init_db()
    try:
        get_model()
    except Exception as e:
        print(f"⚠️  Model pre-load failed: {e}")

# ─── Helper: Run detection on a single frame ────────────────
def detect_frame(yolo: YOLO, frame_np: np.ndarray, confidence: float):
    """Run YOLO on a single frame, return list of detections."""
    results = yolo.predict(source=frame_np, conf=confidence, verbose=False)
    detections = []
    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append({
                "id": uuid.uuid4().hex[:8],
                "class_name": result.names[int(box.cls[0])],
                "confidence": round(float(box.conf[0]), 4),
                "bbox": {
                    "x1": round(x1, 1), "y1": round(y1, 1),
                    "x2": round(x2, 1), "y2": round(y2, 1),
                },
            })
    # Get annotated frame
    annotated = results[0].plot() if results else frame_np
    return detections, annotated

# ─── Core Endpoints ─────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "database": "connected",
        "supported_classes": model.names if model else {},
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/classes")
async def get_classes():
    """Return the weapon classes the model can detect."""
    yolo = get_model()
    return {"classes": yolo.names}

# ─── Image Detection ────────────────────────────────────────
@app.post("/detect")
async def detect(
    file: UploadFile = File(...),
    confidence: float = Query(0.5, ge=0.1, le=1.0),
    user_id: Optional[str] = Query(None),
):
    content_type = file.content_type or ""
    is_image = content_type in IMAGE_TYPES or content_type.startswith("image/")
    is_video = content_type in VIDEO_TYPES or content_type.startswith("video/")

    if not is_image and not is_video:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Upload an image or video."
        )

    filename = file.filename or "unknown"
    contents = await file.read()
    yolo = get_model()

    if is_image:
        return await _detect_image(yolo, contents, filename, confidence, user_id)
    else:
        return await _detect_video(yolo, contents, filename, confidence, user_id)

# ─── Image Processing ───────────────────────────────────────
async def _detect_image(yolo, contents, filename, confidence, user_id=None):
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read image file")

    detection_list, annotated_frame = detect_frame(yolo, np.array(image), confidence)

    # Unique weapon names
    weapon_names = sorted(set(d["class_name"] for d in detection_list))

    # Save to DB
    detection_id = uuid.uuid4().hex
    timestamp = datetime.utcnow().isoformat()
    _save_to_db(detection_id, filename, "image", timestamp,
                image.width, image.height, confidence,
                len(detection_list), weapon_names, detection_list, user_id)

    # Generate base64 annotated image for web display
    annotated_image = Image.fromarray(annotated_frame[..., ::-1])
    buffer = io.BytesIO()
    annotated_image.save(buffer, format="JPEG", quality=90)
    annotated_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return JSONResponse(content={
        "success": True,
        "media_type": "image",
        "detection_id": detection_id,
        "filename": filename,
        "image_width": image.width,
        "image_height": image.height,
        "confidence_threshold": confidence,
        "total_detections": len(detection_list),
        "weapon_names": weapon_names,
        "detections": detection_list,
        "annotated_image": f"data:image/jpeg;base64,{annotated_b64}",
        "timestamp": timestamp,
    })

# ─── Video Processing ───────────────────────────────────────
async def _detect_video(yolo, contents, filename, confidence, user_id=None):
    # Write input video to temp file for OpenCV
    suffix = os.path.splitext(filename)[1] or ".mp4"
    tmp_in = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp_in.write(contents)
    tmp_in.close()

    # Temp file for annotated output video (raw from OpenCV)
    tmp_out = tempfile.NamedTemporaryFile(delete=False, suffix=".avi")
    tmp_out.close()

    # Temp file for browser-compatible H.264 video
    tmp_h264 = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    tmp_h264.close()

    try:
        cap = cv2.VideoCapture(tmp_in.name)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not read video file")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        
        orig_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        orig_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Fast processing optimizations
        # 1. Resize to max 480p (854 width)
        MAX_DIM = 854
        if orig_width > MAX_DIM:
            ratio = MAX_DIM / orig_width
            width = MAX_DIM
            height = int(orig_height * ratio)
        else:
            width = orig_width
            height = orig_height

        duration = round(total_frames / fps, 1) if fps > 0 else 0

        # Setup video writer
        fourcc = cv2.VideoWriter_fourcc(*"XVID")
        writer = cv2.VideoWriter(tmp_out.name, fourcc, fps, (width, height))

        max_frames = int(fps * MAX_VIDEO_SECONDS)
        all_detections = []
        frame_count = 0

        # 2. Process ~5 YOLO frames per second
        process_every_n_frames = max(1, int(fps / 5))
        last_annotated = None

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_count >= max_frames:
                break

            # Resize the frame if it's too large
            if frame.shape[1] > MAX_DIM:
                frame = cv2.resize(frame, (width, height))

            # Only run heavy YOLO detection every Nth frame
            if frame_count % process_every_n_frames == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                detections, annotated = detect_frame(yolo, frame_rgb, confidence)
                all_detections.extend(detections)
                
                # Convert back to BGR for saving
                annotated_bgr = annotated[..., ::-1] if annotated is not None else frame
                last_annotated = annotated_bgr
            else:
                # Reuse the last annotated frame or current frame if none exists
                if last_annotated is not None:
                    annotated_bgr = last_annotated
                else:
                    annotated_bgr = frame

            # Write annotated frame
            writer.write(annotated_bgr)
            frame_count += 1

        cap.release()
        writer.release()

        # Unique weapon names found across entire video
        weapon_names = sorted(set(d["class_name"] for d in all_detections))

        # Build a summary of detections (unique weapons with max confidence)
        weapon_summary = {}
        for d in all_detections:
            name = d["class_name"]
            if name not in weapon_summary or d["confidence"] > weapon_summary[name]["confidence"]:
                weapon_summary[name] = {
                    "class_name": name,
                    "confidence": d["confidence"],
                    "count": 0,
                }
            weapon_summary[name]["count"] += 1

        summary_list = sorted(weapon_summary.values(), key=lambda x: x["count"], reverse=True)

        # Save to DB
        detection_id = uuid.uuid4().hex
        timestamp = datetime.utcnow().isoformat()
        _save_to_db(detection_id, filename, "video", timestamp,
                    width, height, confidence,
                    len(all_detections), weapon_names, summary_list, user_id)

        # Re-encode to H.264 for browser compatibility
        subprocess.run([
            "ffmpeg", "-y",
            "-i", tmp_out.name,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-movflags", "+faststart",
            "-pix_fmt", "yuv420p",
            "-an",
            tmp_h264.name,
        ], capture_output=True, timeout=120)

        # Read the H.264 video and encode as base64
        with open(tmp_h264.name, "rb") as f:
            video_bytes = f.read()
        video_b64 = base64.b64encode(video_bytes).decode("utf-8")

        return JSONResponse(content={
            "success": True,
            "media_type": "video",
            "detection_id": detection_id,
            "filename": filename,
            "video_info": {
                "width": width,
                "height": height,
                "fps": round(fps, 1),
                "total_frames": total_frames,
                "duration_seconds": duration,
                "frames_analyzed": frame_count,
            },
            "confidence_threshold": confidence,
            "total_detections": len(all_detections),
            "weapon_names": weapon_names,
            "weapon_summary": summary_list,
            "detections": summary_list,
            "annotated_video": f"data:video/mp4;base64,{video_b64}",
            "timestamp": timestamp,
        })
    finally:
        os.unlink(tmp_in.name)
        for f in [tmp_out.name, tmp_h264.name]:
            if os.path.exists(f):
                os.unlink(f)

# ─── Database Helper ─────────────────────────────────────────
def _save_to_db(detection_id, filename, media_type, timestamp,
                width, height, confidence, total, weapon_names, detections, user_id=None):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        # Use named columns to avoid column-order mismatch with older DB schemas
        cursor.execute('''
            INSERT INTO detections
                (id, filename, media_type, timestamp, image_width, image_height,
                 confidence_threshold, total_detections, weapon_names, detections_json, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            detection_id, filename, media_type, timestamp,
            width, height, confidence, total,
            json.dumps(weapon_names),
            json.dumps(detections),
            user_id,
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"❌ DB Error: {e}")

# ─── History ─────────────────────────────────────────────────
@app.get("/history")
async def get_history(user_id: Optional[str] = Query(None)):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        if user_id:
            cursor.execute('''
                SELECT * FROM detections
                WHERE user_id = ?
                ORDER BY timestamp DESC
                LIMIT 100
            ''', (user_id,))
        else:
            cursor.execute('''
                SELECT * FROM detections
                ORDER BY timestamp DESC
                LIMIT 50
            ''')
        rows = cursor.fetchall()
        conn.close()

        history = []
        for row in rows:
            weapon_names = []
            try:
                weapon_names = json.loads(row['weapon_names']) if row['weapon_names'] else []
            except Exception:
                pass

            # Detect old corrupt rows: timestamp column contains 'image' or 'video'
            # In old rows: media_type col = weapon names list, timestamp col = 'image'/'video',
            # image_width col = real timestamp, image_height col = real width,
            # confidence_threshold = real height, total_detections = real confidence
            raw_ts = row['timestamp'] or ''
            is_corrupt = raw_ts in ('image', 'video') or not ('T' in raw_ts or ':' in raw_ts)

            if is_corrupt:
                # Skip completely corrupt rows - they have no reliable data
                continue

            # Normal (new) row
            history.append({
                "id": row['id'],
                "filename": row['filename'],
                "media_type": row['media_type'] if 'media_type' in row.keys() else "image",
                "timestamp": row['timestamp'],
                "dimensions": f"{row['image_width']}x{row['image_height']}",
                "confidence": row['confidence_threshold'],
                "count": row['total_detections'],
                "weapon_names": weapon_names,
                "detections": json.loads(row['detections_json']) if row['detections_json'] else [],
                "user_id": row['user_id'],
            })

        return history
    except Exception as e:
        print(f"❌ History Error: {e}")
        return []
