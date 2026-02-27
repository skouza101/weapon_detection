"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ─── Inline SVG Icons  ─────────────────────────────── */
const IconUpload = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconShield = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconTarget = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconCheckCircle = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconClock = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconFile = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const IconX = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconRadar = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
  </svg>
);

const IconHistory = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
    <path d="M4.93 4.93l4.24 4.24" />
  </svg>
);

/* ─── Helper ─────────────────────────────────────────── */
function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getTimestamp() {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/* ─── Main Component ─────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveDetections, setLiveDetections] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0.5);
  const [systemTime, setSystemTime] = useState(getTimestamp());

  // Auth guard: redirect to /login if not logged in
  useEffect(() => {
    setIsMounted(true);
    const loggedIn = authClient.isLoggedIn();
    if (!loggedIn || !authClient.getUserEmail()) {
      setRedirecting(true);
      setTimeout(() => router.replace("/login"), 1500);
    } else {
      setIsLoggedIn(true);
    }
  }, [router]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setSystemTime(getTimestamp()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ── Camera Handling ───────── */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsStreaming(true);
      startLiveDetection();
    } catch (err) {
      setError("Erreur d'accès à la caméra.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    stopLiveDetection();
    setLiveDetections([]);
  };

  const startLiveDetection = () => {
    if (detectionIntervalRef.current)
      clearInterval(detectionIntervalRef.current);
    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth === 0) return;
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

      try {
        const res = await fetch(`${API_URL}/detect_frame`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl, confidence }),
        });
        if (res.ok) {
          const data = await res.json();
          setLiveDetections(data.detections || []);
        }
      } catch (err) {}
    }, 500);
  };

  const stopLiveDetection = () => {
    if (detectionIntervalRef.current)
      clearInterval(detectionIntervalRef.current);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const hasThreat = liveDetections.length > 0;
  const currentDetections = liveDetections;

  // Redirect splash screen
  if (redirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-text-main)] font-mono gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--color-danger)]/30" />
          <div className="absolute inset-0 rounded-full border-2 border-t-[var(--color-danger)] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-[var(--color-danger)]">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--color-danger)] font-bold mb-2">
            Accès Refusé
          </p>
          <p className="text-xs text-[var(--color-text-dim)] tracking-widest">
            Connexion requise — Redirection…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)] bg-grid scanline-overlay text-[var(--color-text-main)] font-mono relative overflow-x-hidden">
      {/* ── Ambient Background ──────────────────────── */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[10%] right-[15%] w-[300px] h-[300px] rounded-full opacity-[0.03]"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent-secondary) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Main Content ────────────────────────────── */}
      <main className="flex-grow max-w-[1440px] mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Hero Section */}
        <section className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 badge badge-accent mb-4">
            <IconRadar />
            <span>Système Opérationnel</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide uppercase mb-2 drop-shadow-md">
            Surveillance{" "}
            <span
              className="text-[var(--color-accent)]"
              style={{ textShadow: "0 0 20px rgba(16, 185, 129, 0.5)" }}
            >
              Live
            </span>{" "}
            Caméra
          </h2>
          <p className="text-sm text-[var(--color-text-dim)] max-w-xl mx-auto">
            Activez votre caméra pour lancer la surveillance en direct par
            l'intelligence artificielle YOLOv8m.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── LEFT: Input Panel (2 cols) ──────────── */}
          <div
            className="lg:col-span-2 flex flex-col gap-5 animate-slide-left"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Upload card */}
            <div className="glass-card-elevated p-5 flex-grow flex flex-col">
              <div className="mb-4 text-left">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-accent-secondary)] flex items-center gap-2">
                  <IconTarget />
                  Source d'Entrée
                </h3>
              </div>

              <div className="relative p-4 flex-grow flex flex-col items-center justify-center gap-3 min-h-[280px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] border-dashed rounded-md">
                {isStreaming ? (
                  <button
                    onClick={stopCamera}
                    className="btn-tactical py-3 px-6 rounded-md text-xs tracking-widest uppercase text-[var(--color-danger)] border-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  >
                    Arrêter la Caméra
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="btn-tactical py-3 px-6 rounded-md text-xs tracking-widest uppercase text-[var(--color-text-main)] shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse"
                  >
                    Démarrer la Caméra
                  </button>
                )}
                <p className="text-[10px] text-[var(--color-text-muted)] tracking-wider mt-4 text-center max-w-[80%]">
                  Le flux vidéo sera analysé en temps réel par l'IA YOLOv8m.
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="glass-card p-4 border-[var(--color-danger)]/30 animate-fade-up">
                <div className="flex items-start gap-3">
                  <div className="text-[var(--color-danger)] mt-0.5">
                    <IconAlertTriangle />
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-danger)] font-bold mb-1">
                      Erreur Système
                    </p>
                    <p className="text-xs text-[var(--color-text-dim)]">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats (after result) */}
            {isStreaming && (
              <div
                className="grid grid-cols-2 gap-3 animate-fade-up mt-5"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="stat-card">
                  <p className="text-[9px] text-[var(--color-text-muted)] tracking-[0.15em] uppercase mb-1">
                    Détections
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {liveDetections.length}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="text-[9px] text-[var(--color-text-muted)] tracking-[0.15em] uppercase mb-1">
                    Heure
                  </p>
                  <p className="text-xl font-bold tabular-nums">{systemTime}</p>
                </div>
                <div className="stat-card">
                  <p className="text-[9px] text-[var(--color-text-muted)] tracking-[0.15em] uppercase mb-1">
                    Confiance
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {Math.round(confidence * 100)}%
                  </p>
                </div>
                <div className="stat-card">
                  <p className="text-[9px] text-[var(--color-text-muted)] tracking-[0.15em] uppercase mb-1">
                    Statut
                  </p>
                  <p
                    className={`text-sm font-bold tracking-wider uppercase drop-shadow-md ${hasThreat ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}
                    style={
                      hasThreat
                        ? { textShadow: "0 0 10px rgba(239, 68, 68, 0.6)" }
                        : { textShadow: "0 0 10px rgba(16, 185, 129, 0.6)" }
                    }
                  >
                    {hasThreat ? "MENACE" : "SÉCURISÉ"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Output Panel (3 cols) ────────── */}
          <div
            className="lg:col-span-3 animate-slide-right"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="glass-card-elevated p-5 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-accent-secondary)] flex items-center gap-2">
                  <IconRadar />
                  Sortie Surveillance
                </h3>
                {isStreaming && (
                  <span
                    className={`badge ${hasThreat ? "badge-danger" : "badge-success"}`}
                  >
                    {hasThreat ? (
                      <>
                        <IconAlertTriangle /> Menace
                      </>
                    ) : (
                      <>
                        <IconCheckCircle /> Sécurisé
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Media Display */}
              <div className="flex-grow flex items-center justify-center bg-[var(--color-bg-input)] rounded-md border border-[var(--color-border)] overflow-hidden relative min-h-[350px] sm:min-h-[420px]">
                <>
                  {!isStreaming && (
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <div className="w-16 h-16 rounded-full border border-[var(--color-accent)]/30 flex items-center justify-center">
                        <IconRadar />
                      </div>
                      <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-text-dim)]">
                        Caméra Désactivée
                      </span>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    className={`w-full max-h-full object-contain ${!isStreaming ? "hidden" : ""}`}
                    muted
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {isStreaming && (
                    <svg
                      className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                      viewBox={
                        videoRef.current
                          ? `0 0 ${videoRef.current.videoWidth} ${videoRef.current.videoHeight}`
                          : "0 0 100 100"
                      }
                    >
                      {liveDetections.map((d, i) => (
                        <rect
                          key={i}
                          x={d.bbox.x1}
                          y={d.bbox.y1}
                          width={d.bbox.x2 - d.bbox.x1}
                          height={d.bbox.y2 - d.bbox.y1}
                          fill="none"
                          stroke={d.confidence > 0.7 ? "#ef4444" : "#f59e0b"}
                          strokeWidth="4"
                        />
                      ))}
                    </svg>
                  )}
                </>
              </div>

              {/* Analysis Report */}
              {isStreaming && (
                <div
                  className="mt-4 space-y-3 animate-fade-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[var(--color-accent-secondary)] font-bold border-b border-[var(--color-border)] pb-2">
                    <IconTarget />
                    Rapport d'Analyse
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                    <div>
                      <span className="text-[9px] text-[var(--color-text-muted)] tracking-wider uppercase block text-[var(--color-accent-secondary)] animate-pulse">
                        En direct
                      </span>
                      <span className="truncate block">Flux vidéo activé</span>
                    </div>
                  </div>

                  {/* Threat List */}
                  {hasThreat && (
                    <div
                      className="bg-[var(--color-danger-dim)] border border-[var(--color-danger)]/20 rounded-md p-3 animate-fade-up"
                      style={{ animationDelay: "0.2s" }}
                    >
                      <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-danger)] font-bold mb-2 flex items-center gap-2">
                        <IconAlertTriangle />
                        Menaces Identifiées
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(
                          new Set(liveDetections.map((d) => d.class_name)),
                        ).map((w: any) => (
                          <span key={w} className="badge badge-danger">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasThreat && (
                    <div
                      className="bg-[var(--color-success-dim)] border border-[var(--color-success)]/20 rounded-md p-3 animate-fade-up"
                      style={{ animationDelay: "0.2s" }}
                    >
                      <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-success)] font-bold flex items-center gap-2">
                        <IconCheckCircle />
                        Aucune Menace Détectée — Zone Sécurisée
                      </p>
                    </div>
                  )}

                  {/* Per-detection details */}
                  {currentDetections && currentDetections.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {currentDetections.map((d: any, i: number) => (
                        <div
                          key={d.id || i}
                          className="flex items-center justify-between bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--color-danger)]">
                              <IconTarget />
                            </span>
                            <span className="uppercase tracking-wider font-bold">
                              {d.class_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-1.5 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full conf-bar-fill"
                                style={{
                                  width: `${Math.round(d.confidence * 100)}%`,
                                  background:
                                    d.confidence > 0.7
                                      ? "var(--color-danger)"
                                      : d.confidence > 0.4
                                        ? "var(--color-warning)"
                                        : "var(--color-accent)",
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-[var(--color-text-dim)] tabular-nums w-10 text-right">
                              {Math.round(d.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)] mt-12">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[9px] text-[var(--color-text-muted)] tracking-[0.3em] uppercase">
            WeaponGuard AI · YOLOv8m · Accès Restreint
          </p>
          <div className="flex items-center gap-4 text-[9px] text-[var(--color-text-muted)] tracking-[0.2em] uppercase">
            <Link
              href="/login"
              className="hover:text-[var(--color-accent-secondary)] transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="hover:text-[var(--color-accent-secondary)] transition-colors"
            >
              Inscription
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
