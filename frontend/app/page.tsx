"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

/* ─── SVG Icons ──────────────────────────────────────────── */
const IconDashboard = () => (
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
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
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
    width="20"
    height="20"
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
const IconActivity = () => (
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
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconPercent = () => (
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
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);
const IconTrendUp = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
const IconUser = () => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconFilm = () => (
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
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="17" x2="22" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
  </svg>
);
const IconCamera = () => (
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
    <path d="M23 7l-7 5 7 5V7z" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

function getTimestamp() {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getDateDisplay() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─── Animated Counter ───────────────────────────────────── */
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const steps = 30;
    let step = 0;
    ref.current = setInterval(() => {
      step++;
      setDisplay(Math.round((value * step) / steps));
      if (step >= steps) clearInterval(ref.current!);
    }, 20);
    return () => clearInterval(ref.current!);
  }, [value]);
  return <>{display}</>;
}

/* ─── KPI Card ───────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
  trend,
  delay = "0s",
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  delay?: string;
}) {
  return (
    <div
      className="glass-card-elevated p-5 flex flex-col gap-3 animate-fade-up relative overflow-hidden group"
      style={{ animationDelay: delay, borderTop: `2px solid ${color}33` }}
    >
      {/* Glow */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        }}
      />
      <div className="flex items-center justify-between">
        <p className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-text-muted)] font-bold">
          {label}
        </p>
        <div style={{ color }}>{icon}</div>
      </div>
      <p className="text-4xl font-bold tabular-nums" style={{ color }}>
        <AnimatedNumber value={value} />
      </p>
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-auto">
          {trend && (
            <span
              className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: `${color}22`, color }}
            >
              <IconTrendUp /> {trend}
            </span>
          )}
          {sub && (
            <p className="text-[10px] text-[var(--color-text-dim)]">{sub}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Custom Chart Tooltip ───────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs font-mono border border-[var(--color-border)]">
      <p className="text-[var(--color-text-muted)] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name ?? p.dataKey}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [systemTime, setSystemTime] = useState(getTimestamp());
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

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

  useEffect(() => {
    const t = setInterval(() => setSystemTime(getTimestamp()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchStats = async () => {
    const email = authClient.getUserEmail();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/stats?user_id=${encodeURIComponent(email)}`,
      );
      if (!res.ok) throw new Error("Échec du chargement des statistiques");
      const data = await res.json();
      setStats(data);
      setLastRefresh(getTimestamp());
    } catch (err: any) {
      setError(err.message || "Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchStats();
  }, [isLoggedIn]);

  /* ── Derived metrics ─────────── */
  const threatRate =
    stats && stats.summary.total_scans > 0
      ? Math.round(
          (stats.summary.total_threats / stats.summary.total_scans) * 100,
        )
      : 0;
  const clearScans = stats
    ? stats.summary.total_scans - stats.summary.total_threats
    : 0;

  /* ── Redirect splash ─────────── */
  if (redirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-text-main)] font-mono gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--color-danger)]/30" />
          <div className="absolute inset-0 rounded-full border-2 border-t-[var(--color-danger)] animate-spin" />
        </div>
        <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--color-danger)] font-bold">
          Accès Refusé — Redirection…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)] bg-grid scanline-overlay text-[var(--color-text-main)] font-mono relative overflow-x-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[5%] right-[10%] w-[400px] h-[400px] rounded-full opacity-[0.03]"
          style={{
            background:
              "radial-gradient(circle, var(--color-danger) 0%, transparent 70%)",
          }}
        />
      </div>

      <main className="flex-grow max-w-[1440px] mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        {/* ── Header ───────────────────────────────── */}
        <div className="flex items-start justify-between animate-fade-up">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-accent-secondary)] mb-1">
              <IconDashboard />
              <span className="text-[10px] tracking-[0.3em] uppercase font-bold">
                Analytics
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide uppercase">
              Tableau de Bord{" "}
              <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] bg-clip-text text-transparent">
                Opérationnel
              </span>
            </h1>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1 capitalize">
              {getDateDisplay()}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
              <span className="text-xs text-[var(--color-accent)] font-bold tabular-nums">
                {systemTime}
              </span>
            </div>
            {lastRefresh && (
              <p className="text-[9px] text-[var(--color-text-muted)]">
                MàJ: {lastRefresh}
              </p>
            )}
            <button
              onClick={fetchStats}
              className="btn-tactical flex items-center gap-2 px-4 py-2 rounded text-xs tracking-widest uppercase mt-1"
            >
              <IconRefresh /> Actualiser
            </button>
          </div>
        </div>

        {/* ── Error ────────────────────────────────── */}
        {error && (
          <div className="glass-card p-4 border-[var(--color-danger)]/30 animate-fade-up flex items-center gap-3">
            <div className="text-[var(--color-danger)]">
              <IconAlertTriangle />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-danger)] font-bold mb-0.5">
                Erreur Système
              </p>
              <p className="text-xs text-[var(--color-text-dim)]">{error}</p>
            </div>
          </div>
        )}

        {/* ── Loading ───────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-32 animate-fade-up">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)]/20" />
              <div className="absolute inset-0 rounded-full border-2 border-t-[var(--color-accent)] animate-spin" />
              <div
                className="absolute inset-3 rounded-full border border-[var(--color-accent-secondary)]/30 border-t-[var(--color-accent-secondary)] animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              />
            </div>
            <p className="text-xs tracking-[0.3em] uppercase text-[var(--color-accent-secondary)] animate-pulse">
              Chargement des données…
            </p>
          </div>
        )}

        {!loading && stats && (
          <>
            {/* ── KPI Row ──────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total Analyses (7j)"
                value={stats.summary.total_scans}
                icon={<IconActivity />}
                color="var(--color-accent)"
                trend="+7j"
                sub="Fichiers traités"
                delay="0.05s"
              />
              <KpiCard
                label="Menaces Détectées"
                value={stats.summary.total_threats}
                icon={<IconAlertTriangle />}
                color="var(--color-danger)"
                trend="Alerte"
                sub="Armes détectées"
                delay="0.1s"
              />
              <KpiCard
                label="Analyses Sûres"
                value={clearScans}
                icon={<IconShield />}
                color="var(--color-success, #10b981)"
                sub="Aucune menace"
                delay="0.15s"
              />
              <KpiCard
                label="Taux de Menace"
                value={threatRate}
                icon={<IconPercent />}
                color="#f59e0b"
                sub="% d'analyses"
                delay="0.2s"
              />
            </div>

            {/* ── Charts Row ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Area chart – timeline */}
              <div
                className="lg:col-span-2 glass-card-elevated p-5 animate-fade-up"
                style={{ animationDelay: "0.25s" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-accent-secondary)]">
                    Activité des 7 derniers jours
                  </h3>
                  <span className="badge badge-accent text-[9px]">
                    Temps réel
                  </span>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.timeline}>
                      <defs>
                        <linearGradient
                          id="gradMenace"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ef4444"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ef4444"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2a1e" />
                      <XAxis
                        dataKey="date"
                        stroke="#444"
                        tick={{ fontSize: 9 }}
                      />
                      <YAxis
                        stroke="#444"
                        tick={{ fontSize: 9 }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Menaces"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        fill="url(#gradMenace)"
                        dot={{ r: 3, fill: "#ef4444" }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie chart – distribution */}
              <div
                className="glass-card-elevated p-5 animate-fade-up"
                style={{ animationDelay: "0.3s" }}
              >
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-accent-secondary)] mb-5">
                  Répartition par Type
                </h3>
                {stats.distribution.length > 0 ? (
                  <>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.distribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {stats.distribution.map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="mt-2 space-y-1.5">
                      {stats.distribution
                        .slice(0, 4)
                        .map((d: any, i: number) => (
                          <div
                            key={d.name}
                            className="flex items-center justify-between text-[10px]"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  background: COLORS[i % COLORS.length],
                                }}
                              />
                              <span className="text-[var(--color-text-dim)] capitalize">
                                {d.name}
                              </span>
                            </div>
                            <span
                              className="font-bold tabular-nums"
                              style={{ color: COLORS[i % COLORS.length] }}
                            >
                              {d.value}
                            </span>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="h-44 flex items-center justify-center text-[var(--color-text-dim)] text-xs tracking-widest uppercase opacity-50">
                    Aucune donnée
                  </div>
                )}
              </div>
            </div>

            {/* ── Bar Chart + User Panel ────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Bar chart – daily breakdown */}
              <div
                className="lg:col-span-2 glass-card-elevated p-5 animate-fade-up"
                style={{ animationDelay: "0.35s" }}
              >
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-accent-secondary)] mb-5">
                  Analyses vs Menaces par Jour
                </h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.timeline} barSize={12}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2a1e" />
                      <XAxis
                        dataKey="date"
                        stroke="#444"
                        tick={{ fontSize: 9 }}
                      />
                      <YAxis
                        stroke="#444"
                        tick={{ fontSize: 9 }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="count"
                        name="Menaces"
                        fill="#ef4444"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* User info panel */}
              <div
                className="glass-card-elevated p-5 animate-fade-up flex flex-col gap-4"
                style={{ animationDelay: "0.4s" }}
              >
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-accent-secondary)]">
                  Opérateur
                </h3>

                {/* Avatar */}
                <div className="flex flex-col items-center gap-3 py-3">
                  <div className="w-14 h-14 rounded-full border-2 border-[var(--color-accent)]/30 flex items-center justify-center bg-[var(--color-bg-secondary)] text-[var(--color-accent)] relative">
                    <IconUser />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-bg-primary)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-[var(--color-text-main)] truncate max-w-[160px]">
                      {userEmail}
                    </p>
                    <p className="text-[9px] text-[var(--color-accent)] tracking-wider uppercase mt-0.5">
                      Actif
                    </p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[var(--color-bg-primary)] rounded-md p-2">
                    <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">
                      Analyses
                    </p>
                    <p className="text-lg font-bold tabular-nums">
                      {stats.summary.total_scans}
                    </p>
                  </div>
                  <div className="bg-[var(--color-bg-primary)] rounded-md p-2">
                    <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">
                      Menaces
                    </p>
                    <p className="text-lg font-bold tabular-nums text-[var(--color-danger)]">
                      {stats.summary.total_threats}
                    </p>
                  </div>
                </div>

                {/* Quick links */}
                <div className="mt-auto space-y-2">
                  <Link
                    href="/analyze"
                    className="flex items-center gap-2 w-full btn-tactical text-[10px] tracking-widest uppercase px-3 py-2 rounded justify-center hover:text-[var(--color-accent)] transition-colors"
                  >
                    <IconFilm /> Analyser un fichier
                  </Link>
                  <Link
                    href="/live"
                    className="flex items-center gap-2 w-full btn-tactical text-[10px] tracking-widest uppercase px-3 py-2 rounded justify-center hover:text-[var(--color-accent)] transition-colors"
                  >
                    <IconCamera /> Caméra live
                  </Link>
                  <Link
                    href="/history"
                    className="flex items-center gap-2 w-full btn-tactical text-[10px] tracking-widest uppercase px-3 py-2 rounded justify-center hover:text-[var(--color-accent)] transition-colors"
                  >
                    <IconTarget /> Historique
                  </Link>
                </div>
              </div>
            </div>

            {/* ── System Status Bar ─────────────────── */}
            <div
              className="glass-card p-4 animate-fade-up"
              style={{ animationDelay: "0.45s" }}
            >
              <div className="flex flex-wrap items-center gap-6 text-[10px] text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                  <span>Système Opérationnel</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-secondary)]" />
                  <span>IA: YOLOv8m</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-secondary)]" />
                  <span>API: {API_URL}</span>
                </div>
                <div className="ml-auto font-bold text-[var(--color-text-main)] tabular-nums">
                  {systemTime}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
