"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

const IconShield = () => (
  <svg
    width="24"
    height="24"
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

const IconHome = () => (
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
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

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

const IconLogout = () => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export default function Sidebar() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsLoggedIn(authClient.isLoggedIn());
  }, [pathname]);

  if (!isMounted) return null;

  // Hide sidebar on auth pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-md transition-all text-xs tracking-widest uppercase font-bold border ${
      active
        ? "bg-[var(--color-accent)]/20 text-[var(--color-text-main)] border-[var(--color-accent)]/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
        : "text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-card)] border-transparent"
    }`;

  return (
    <div className="w-full md:w-64 bg-[var(--color-bg-secondary)]/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-[var(--color-border)] flex-shrink-0 flex flex-col md:h-screen md:sticky md:top-0 relative z-50">
      <div className="p-6 border-b border-[var(--color-border)] flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] flex items-center justify-center text-black">
          <IconShield />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] uppercase leading-none">
            WeaponGuard
            <span className="text-[var(--color-accent-secondary)] ml-1">
              AI
            </span>
          </h1>
          <p className="text-[9px] text-[var(--color-text-dim)] tracking-[0.3em] uppercase mt-1">
            Système Central
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4 items-stretch">
        <Link href="/" className={navLinkClass(pathname === "/")}>
          <IconDashboard /> <span>Dashboard</span>
        </Link>
        <Link href="/analyze" className={navLinkClass(pathname === "/analyze")}>
          <IconHome /> <span>Analyse Fichier</span>
        </Link>
        <Link href="/live" className={navLinkClass(pathname === "/live")}>
          <IconShield /> <span>Caméra Live</span>
        </Link>

        {isLoggedIn ? (
          <Link
            href="/history"
            className={navLinkClass(pathname === "/history")}
          >
            <IconHistory /> <span>Historique</span>
          </Link>
        ) : (
          <>
            <Link href="/login" className={navLinkClass(pathname === "/login")}>
              Connexion
            </Link>
            <Link
              href="/register"
              className={navLinkClass(pathname === "/register")}
            >
              Inscription
            </Link>
          </>
        )}
      </div>

      {isLoggedIn && (
        <div className="p-4 border-t border-[var(--color-border)] mt-auto">
          <button
            onClick={() => {
              authClient.removeToken();
              window.location.reload();
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-md transition-all text-xs tracking-widest uppercase font-bold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 border border-transparent hover:border-[var(--color-danger)]/50 shadow-none hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
          >
            <IconLogout /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
