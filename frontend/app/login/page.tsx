"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import PartnerCornerCards from "@/components/PartnerCornerCards";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !password) {
      setError("Veuillez renseigner l'email et le mot de passe.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail ?? "Échec de la connexion");

      // Save token and email for per-user history (use server-normalized email)
      const token = data.access_token || data.token;
      const normalizedEmail = data.email || email.trim().toLowerCase();
      authClient.setToken(token || "dummy_token");
      authClient.setUserEmail(normalizedEmail);

      setSuccess("Connexion réussie. Initialisation du dashboard...");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-primary)] bg-grid relative overflow-hidden items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden flex items-center justify-center opacity-20 select-none">
        <div className="absolute w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full border border-[var(--color-accent)]/20" />
        <div className="absolute h-full w-[1px] bg-[var(--color-accent)]/30 animate-radar" />
      </div>

      <div className="w-full max-w-md glass-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold font-mono tracking-wider uppercase">
            CONNEXION
          </h1>
          <p className="text-xs text-[var(--color-accent)]/60 font-mono tracking-widest uppercase">
            SYSTÈME DE CONTRÔLE D'ACCÈS
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="text-xs font-mono tracking-widest text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 px-4 py-3 rounded-sm animate-in fade-in slide-in-from-top-1 uppercase">
              {error}
            </div>
          )}
          {success && (
            <div className="text-xs font-mono tracking-widest text-[var(--color-success)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 px-4 py-3 rounded-sm animate-in fade-in slide-in-from-top-1 uppercase">
              {success}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-[var(--color-accent)]/80 uppercase tracking-widest">
              Identifiant Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-sm bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:border-[var(--color-accent)] outline-none transition-colors font-mono"
              placeholder="OPERATEUR@EMAIL.COM"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-[var(--color-accent)]/80 uppercase tracking-widest">
              Code d'Accès
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-sm bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:border-[var(--color-accent)] outline-none transition-colors font-mono"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-md bg-gradient-to-r from-[var(--color-bg-card)] to-[var(--color-border)] border border-[var(--color-border-active)] font-bold font-mono tracking-widest text-[var(--color-text-main)] hover:shadow-lg hover:shadow-[var(--color-bg-card)]/50 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "AUTHENTIFICATION..." : "CONNEXION"}
          </button>
        </form>

        <div className="flex justify-between items-center text-[10px] font-mono tracking-widest uppercase py-2 border-t border-[var(--color-border)]">
          <Link
            href="/register"
            className="text-[var(--color-accent)] hover:text-[var(--color-accent-secondary)] transition-colors underline"
          >
            Nouveau Compte
          </Link>
          <Link
            href="/"
            className="text-[var(--color-accent)]/60 hover:text-[var(--color-accent)] transition-colors"
          >
            Retour
          </Link>
        </div>
      </div>
      <PartnerCornerCards />

      <footer className="mt-6 text-[10px] text-[var(--color-accent)]/30 font-mono tracking-widest uppercase">
        TacticalOps SYS · Accès Restreint · MIL-STD-810
      </footer>
    </div>
  );
}
