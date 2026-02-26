"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ─── Types ──────────────────────────────────────────────── */
interface WeaponEntry {
  class_name?: string;
  confidence?: number;
  count?: number;
  bbox?: object;
}

interface DetectionEntry {
  id?: string;
  class_name: string;
  confidence: number;
  bbox?: object;
}

interface HistoryItem {
  id: string;
  filename: string;
  media_type: string;
  timestamp: string;
  dimensions: string;
  confidence: number; // threshold (kept for compat)
  count: number;
  weapon_names: (string | WeaponEntry)[];
  detections: DetectionEntry[];
  user_id: string | null;
}

/** Returns the average confidence of detected weapons from the detections array */
function getAvgConfidence(detections: DetectionEntry[]): number | null {
  if (!detections || detections.length === 0) return null;
  const scores = detections
    .map((d) => d.confidence)
    .filter((c): c is number => typeof c === "number" && c > 0);
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/* ─── SVG Icons ──────────────────────────────────────────── */
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

const IconHistory = () => (
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
    <polyline points="12 6 12 12 16 14" />
    <path d="M4.93 4.93l4.24 4.24" />
  </svg>
);

const IconTarget = () => (
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
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconAlertTriangle = () => (
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
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconCheckCircle = () => (
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
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
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

const IconVideo = () => (
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
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const IconRefresh = () => (
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
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

/* ─── Helper ─────────────────────────────────────────────── */
function formatDate(iso: string) {
  try {
    // Take only "YYYY-MM-DDTHH:MM:SS" (first 19 chars) to avoid backend garbage suffixes
    const d = new Date(iso.slice(0, 19) + "Z");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/* ─── Main Component ─────────────────────────────────────── */
export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Auth guard: redirect to home if not logged in
  useEffect(() => {
    const loggedIn = authClient.isLoggedIn();
    const email = authClient.getUserEmail();
    if (!loggedIn || !email) {
      setRedirecting(true);
      setTimeout(() => router.replace("/login"), 1500);
      return;
    }
    setIsLoggedIn(true);
    setUserEmail(email);
  }, [router]);

  const fetchHistory = async () => {
    const email = authClient.getUserEmail();
    if (!email) return; // safety check
    setLoading(true);
    setError(null);
    try {
      // Always filter by the logged-in user's email
      const url = `${API_URL}/history?user_id=${encodeURIComponent(email)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Échec du chargement de l'historique");
      const data: HistoryItem[] = await res.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const threatCount = history.filter((h) => h.weapon_names.length > 0).length;
  const totalDetections = history.reduce((sum, h) => sum + h.count, 0);

  // Redirect screen — shown while waiting for redirect
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
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
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
            <Link
              href="/"
              className="text-[10px] tracking-widest uppercase text-[var(--color-text-dim)] hover:text-[var(--color-accent-secondary)] transition-colors border border-[var(--color-border)] px-3 py-1.5 rounded hover:border-[var(--color-accent)]"
            >
              Accueil
            </Link>
            {!isLoggedIn && (
              <Link
                href="/login"
                className="text-[10px] tracking-widest uppercase text-[var(--color-text-dim)] hover:text-[var(--color-accent-secondary)] transition-colors border border-[var(--color-border)] px-3 py-1.5 rounded hover:border-[var(--color-accent)]"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="flex-grow max-w-[1440px] mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Title row */}
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-accent-secondary)] mb-1">
              <IconHistory />
              <span className="text-[10px] tracking-[0.3em] uppercase font-bold">
                Journal d'Opérations
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-wide uppercase">
              Historique{" "}
              <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] bg-clip-text text-transparent">
                {userEmail ? "Personnel" : "Global"}
              </span>
            </h2>
            {userEmail && (
              <p className="text-xs text-[var(--color-text-dim)] mt-1">
                Analyses liées au compte :{" "}
                <span className="text-[var(--color-accent-secondary)]">
                  {userEmail}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={fetchHistory}
            className="btn-tactical flex items-center gap-2 px-4 py-2 rounded text-xs tracking-widest uppercase"
          >
            <IconRefresh />
            Actualiser
          </button>
        </div>

        {/* Stats strip */}
        {!loading && !error && history.length > 0 && (
          <div
            className="grid grid-cols-3 gap-4 mb-8 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="stat-card">
              <p className="text-[9px] text-[var(--color-text-muted)] tracking-[0.15em] uppercase mb-1">
                Analyses Total
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {history.length}
              </p>
            </div>
            <div className="stat-card">
              <p className="text-[9px] text-[var(--color-text-muted)] tracking-[0.15em] uppercase mb-1">
                Menaces Détectées
              </p>
              <p className="text-2xl font-bold tabular-nums text-[var(--color-danger)]">
                {threatCount}
              </p>
            </div>
            <div className="stat-card">
              <p className="text-[9px] text-[var(--color-text-muted)] tracking-[0.15em] uppercase mb-1">
                Détections Totales
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {totalDetections}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-24 animate-fade-up">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)]/20" />
              <div className="absolute inset-0 rounded-full border-2 border-t-[var(--color-accent)] animate-spin" />
            </div>
            <p className="text-xs tracking-[0.3em] uppercase text-[var(--color-accent-secondary)] animate-pulse">
              Chargement du journal…
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="glass-card p-6 border-[var(--color-danger)]/30 animate-fade-up max-w-lg mx-auto">
            <div className="flex items-start gap-3">
              <div className="text-[var(--color-danger)]">
                <IconAlertTriangle />
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-danger)] font-bold mb-1">
                  Erreur Système
                </p>
                <p className="text-xs text-[var(--color-text-dim)]">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && history.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-24 opacity-50 animate-fade-up">
            <div className="w-20 h-20 rounded-full border border-[var(--color-accent)]/30 flex items-center justify-center">
              <IconHistory />
            </div>
            <p className="text-xs tracking-[0.3em] uppercase text-[var(--color-text-dim)]">
              Aucune analyse enregistrée
            </p>
            <Link
              href="/"
              className="btn-tactical px-6 py-2 rounded text-xs tracking-widest uppercase mt-2"
            >
              Lancer une Analyse
            </Link>
          </div>
        )}

        {/* History list */}
        {!loading && !error && history.length > 0 && (
          <div
            className="space-y-3 animate-fade-up"
            style={{ animationDelay: "0.15s" }}
          >
            {history.map((item, i) => {
              const hasThreat = item.weapon_names.length > 0;
              return (
                <div
                  key={item.id}
                  className={`glass-card-elevated p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors relative overflow-hidden border-l-4 ${hasThreat ? "border-l-[var(--color-danger)] hover:border-[var(--color-danger)]/30" : "border-l-[var(--color-success)] hover:border-[var(--color-success)]/30"}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {/* Left: file info */}
                  <div className="flex items-center gap-3 flex-grow min-w-0">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${hasThreat ? "bg-[var(--color-danger-dim)] text-[var(--color-danger)]" : "bg-[var(--color-success-dim)] text-[var(--color-success)]"}`}
                    >
                      {item.media_type === "video" ? (
                        <IconVideo />
                      ) : (
                        <IconFile />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate tracking-wider">
                        {item.filename}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-dim)] tracking-wider">
                        {(() => {
                          try {
                            const d = new Date(
                              item.timestamp.slice(0, 19) + "Z",
                            );
                            return isNaN(d.getTime())
                              ? item.timestamp.slice(0, 19)
                              : d.toLocaleString("fr-FR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                          } catch {
                            return item.timestamp.slice(0, 10);
                          }
                        })()}{" "}
                        · {item.dimensions}
                      </p>
                    </div>
                  </div>

                  {/* Center: threat badges */}
                  <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                    {hasThreat ? (
                      item.weapon_names.map((w: any, wi: number) => {
                        const label =
                          typeof w === "string"
                            ? w
                            : (w?.class_name ?? JSON.stringify(w));
                        return (
                          <span
                            key={`${label}-${wi}`}
                            className="badge badge-danger"
                          >
                            <IconAlertTriangle /> {label}
                          </span>
                        );
                      })
                    ) : (
                      <span className="badge badge-success">
                        <IconCheckCircle /> Zone Sécurisée
                      </span>
                    )}
                  </div>

                  {/* Right: stats */}
                  <div className="flex items-center gap-4 flex-shrink-0 text-right">
                    <div>
                      <p className="text-[9px] text-[var(--color-text-muted)] tracking-wider uppercase">
                        Détections
                      </p>
                      <p
                        className={`text-sm font-bold tabular-nums ${hasThreat ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}
                      >
                        {item.count}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[var(--color-text-muted)] tracking-wider uppercase">
                        Confiance
                      </p>
                      <p className="text-sm font-bold tabular-nums text-[var(--color-accent-secondary)]">
                        {(() => {
                          const avg = getAvgConfidence(item.detections);
                          return avg !== null
                            ? `${Math.round(avg * 100)}%`
                            : "—";
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`badge ${hasThreat ? "badge-danger" : "badge-success"}`}
                      >
                        {hasThreat ? "MENACE" : "SÉCURISÉ"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)] mt-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[9px] text-[var(--color-text-muted)] tracking-[0.3em] uppercase">
            WeaponGuard AI · YOLOv8m · Journal Opérateur
          </p>
          <div className="flex items-center gap-4 text-[9px] text-[var(--color-text-muted)] tracking-[0.2em] uppercase">
            <Link
              href="/"
              className="hover:text-[var(--color-accent-secondary)] transition-colors"
            >
              Accueil
            </Link>
            <Link
              href="/login"
              className="hover:text-[var(--color-accent-secondary)] transition-colors"
            >
              Connexion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
