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
  const [redirecting, setRedirecting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [confidence, setConfidence] = useState(0.5);
  const [analysisTime, setAnalysisTime] = useState<number | null>(null);
  const [systemTime, setSystemTime] = useState(getTimestamp());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth guard: redirect to /login if not logged in
  useEffect(() => {
    if (!authClient.isLoggedIn() || !authClient.getUserEmail()) {
      setRedirecting(true);
      setTimeout(() => router.replace("/login"), 1500);
    }
  }, [router]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setSystemTime(getTimestamp()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ── File Handling ─────────── */
  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setAnalysisTime(null);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else if (f.type.startsWith("video/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setAnalysisTime(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Drag & Drop ───────────── */
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  /* ── Analysis ──────────────── */
  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAnalysisTime(null);
    const start = performance.now();

    const formData = new FormData();
    formData.append("file", file);

    // Include user_id if logged in
    const userEmail = authClient.getUserEmail();
    const detectUrl = userEmail
      ? `${API_URL}/detect?confidence=${confidence}&user_id=${encodeURIComponent(userEmail)}`
      : `${API_URL}/detect?confidence=${confidence}`;

    try {
      const res = await fetch(detectUrl, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Échec du traitement du fichier");
      }
      const data = await res.json();
      setAnalysisTime(Math.round(performance.now() - start));
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const hasThreat = result?.weapon_names?.length > 0;

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

      {/* ── Top Bar ─────────────────────────────────── */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] flex items-center justify-center text-black">
              <IconShield />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-[0.2em] uppercase leading-none">
                WeaponGuard
                <span className="text-[var(--color-accent-secondary)] ml-1">
                  AI
                </span>
              </h1>
              <p className="text-[9px] text-[var(--color-text-dim)] tracking-[0.3em] uppercase">
                Système de Détection de Menaces
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {authClient.isLoggedIn() ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/history"
                  className="text-[10px] tracking-widest uppercase text-[var(--color-text-main)] bg-[var(--color-bg-card)] hover:bg-[var(--color-accent)]/20 transition-all border border-[var(--color-border)] px-4 py-1.5 rounded hover:border-[var(--color-accent)] shadow-[0_0_10px_rgba(16,185,129,0)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  Historique
                </Link>

                <button
                  onClick={() => {
                    authClient.removeToken();
                    window.location.reload();
                  }}
                  className="text-[10px] cursor-pointer tracking-widest uppercase text-[var(--color-danger)] bg-[var(--color-bg-card)] hover:bg-[var(--color-danger)]/20 transition-all border border-[var(--color-danger)]/40 px-4 py-1.5 rounded hover:border-[var(--color-danger)] shadow-[0_0_10px_rgba(239,68,68,0)] hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[10px] tracking-widest uppercase text-[var(--color-text-dim)] hover:text-[var(--color-accent-secondary)] transition-colors border border-[var(--color-border)] px-3 py-1.5 rounded hover:border-[var(--color-accent)]"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="text-[10px] tracking-widest uppercase text-[var(--color-bg-primary)] bg-[var(--color-accent)] transition-all px-3 py-1.5 rounded font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:bg-[var(--color-accent-secondary)]"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────── */}
      <main className="flex-grow max-w-[1440px] mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Hero Section */}
        <section className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 badge badge-accent mb-4">
            <IconRadar />
            <span>Système Opérationnel</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide uppercase mb-2 drop-shadow-md">
            Analyse de{" "}
            <span
              className="text-[var(--color-accent)]"
              style={{ textShadow: "0 0 20px rgba(16, 185, 129, 0.5)" }}
            >
              Menaces
            </span>{" "}
            en Temps Réel
          </h2>
          <p className="text-sm text-[var(--color-text-dim)] max-w-xl mx-auto">
            Téléversez une image ou vidéo pour lancer la détection automatique
            d'armes par intelligence artificielle YOLOv8m.
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-accent-secondary)] flex items-center gap-2">
                  <IconTarget />
                  Source d'Entrée
                </h3>
                {file && (
                  <button
                    onClick={clearFile}
                    className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)] transition-colors"
                    title="Effacer"
                  >
                    <IconX />
                  </button>
                )}
              </div>

              {/* Drop Zone */}
              <div
                className={`drop-zone relative p-4 flex-grow flex flex-col items-center justify-center gap-3 min-h-[280px] ${dragging ? "drag-over" : ""}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!file ? (
                  <>
                    <div className="text-[var(--color-accent-secondary)] opacity-60">
                      <IconUpload />
                    </div>
                    <p className="text-xs text-[var(--color-text-dim)] tracking-widest uppercase text-center">
                      Glisser-déposer ou cliquer
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] tracking-wider uppercase">
                      Images · Vidéos · Max 20s
                    </p>
                  </>
                ) : (
                  <div className="relative w-full h-full flex flex-col items-center justify-center gap-2">
                    {preview &&
                      (file.type.startsWith("video/") ? (
                        <video
                          src={preview}
                          className="w-full h-full object-contain rounded"
                          style={{ maxHeight: "calc(100% - 48px)" }}
                          controls
                          muted
                        />
                      ) : (
                        <img
                          src={preview}
                          alt="aperçu"
                          className="w-full h-full object-contain rounded"
                          style={{ maxHeight: "calc(100% - 48px)" }}
                        />
                      ))}
                    <div className="absolute bottom-2 flex items-center gap-2 text-xs text-[var(--color-accent-secondary)] bg-[var(--color-bg-primary)]/70 px-2 py-1 rounded">
                      <IconFile />
                      <span className="truncate max-w-[180px]">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-dim)]">
                        {formatFileSize(file.size)} ·{" "}
                        {file.type.startsWith("video/") ? "Vidéo" : "Image"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className="btn-tactical w-full mt-5 py-3.5 rounded-md font-bold tracking-[0.2em] uppercase text-sm text-[var(--color-text-main)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                    Analyse en cours…
                  </>
                ) : (
                  <>
                    <IconTarget />
                    Lancer l'Analyse
                  </>
                )}
              </button>
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
            {result && (
              <div
                className="grid grid-cols-2 gap-3 animate-fade-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="stat-card">
                  <p className="text-[9px] text-[var(--color-text-muted)] tracking-[0.15em] uppercase mb-1">
                    Détections
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {result.total_detections}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="text-[9px] text-[var(--color-text-muted)] tracking-[0.15em] uppercase mb-1">
                    Temps
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {analysisTime
                      ? `${(analysisTime / 1000).toFixed(1)}s`
                      : "—"}
                  </p>
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
                {result && (
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
                {!result && !loading && (
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <div className="w-16 h-16 rounded-full border border-[var(--color-accent)]/30 flex items-center justify-center">
                      <IconRadar />
                    </div>
                    <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-text-dim)]">
                      En attente du signal…
                    </span>
                  </div>
                )}

                {loading && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)]/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-t-[var(--color-accent)] animate-spin" />
                      <div className="absolute inset-2 rounded-full border border-[var(--color-accent-secondary)]/20" />
                      <div
                        className="absolute inset-2 rounded-full border border-t-[var(--color-accent-secondary)] animate-spin"
                        style={{
                          animationDirection: "reverse",
                          animationDuration: "1.5s",
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs tracking-[0.3em] uppercase text-[var(--color-accent-secondary)] animate-pulse">
                        Traitement du Signal…
                      </p>
                      <p className="text-[9px] text-[var(--color-text-muted)] tracking-wider mt-1">
                        Analyse IA en cours
                      </p>
                    </div>
                  </div>
                )}

                {result && result.media_type === "image" && (
                  <img
                    src={result.annotated_image}
                    alt="Résultat de détection"
                    className="w-full h-full object-contain animate-fade-in"
                  />
                )}

                {result && result.media_type === "video" && (
                  <video
                    controls
                    autoPlay
                    src={result.annotated_video}
                    className="w-full h-full object-contain animate-fade-in"
                  />
                )}

                {/* Scan line when loading */}
                {loading && (
                  <div className="scan-line-effect absolute inset-0 pointer-events-none" />
                )}
              </div>

              {/* Analysis Report */}
              {result && (
                <div
                  className="mt-4 space-y-3 animate-fade-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[var(--color-accent-secondary)] font-bold border-b border-[var(--color-border)] pb-2">
                    <IconTarget />
                    Rapport d'Analyse
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[9px] text-[var(--color-text-muted)] tracking-wider uppercase block">
                        Fichier
                      </span>
                      <span className="truncate block">{result.filename}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--color-text-muted)] tracking-wider uppercase block">
                        Type
                      </span>
                      <span className="uppercase">{result.media_type}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--color-text-muted)] tracking-wider uppercase block">
                        Dimensions
                      </span>
                      <span className="tabular-nums">
                        {result.media_type === "image"
                          ? `${result.image_width}×${result.image_height}`
                          : result.video_info
                            ? `${result.video_info.width}×${result.video_info.height}`
                            : "—"}
                      </span>
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
                        {result.weapon_names.map((w: string) => (
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
                  {result.detections && result.detections.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {result.detections.map((d: any, i: number) => (
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
