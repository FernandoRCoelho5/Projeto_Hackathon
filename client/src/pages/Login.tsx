import { useState } from "react";
import { ROLE_LABELS } from "../lib/auth";
import type { Role } from "../lib/types";
import { HeroSection, RetroGrid } from "../components/ui/hero-section-dark";
import { Logo } from "../components/Logo";

const DEMO_ACCOUNTS: { username: string; senha: string; nome: string; role: Role; icon: string }[] = [
  { username: "marina", senha: "1234", nome: "Marina", role: "administrador", icon: "🛡" },
  { username: "carlos", senha: "1234", nome: "Carlos · Elétrica", role: "tecnico", icon: "🔧" },
  { username: "ana", senha: "1234", nome: "Ana · Mecânica", role: "tecnico", icon: "🔧" },
  { username: "rafael", senha: "1234", nome: "Rafael · Hidráulica", role: "tecnico", icon: "🔧" },
];

export function Login({
  onLogin,
}: {
  onLogin: (username: string, senha: string) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !senha) return;
    setSubmitting(true);
    setError(null);
    try {
      await onLogin(username, senha);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemoAccount(account: (typeof DEMO_ACCOUNTS)[number]) {
    setUsername(account.username);
    setSenha(account.senha);
    setError(null);
  }

  return (
    <div className="relative min-h-dvh bg-base-950">
      <RetroGrid />

      <div className="relative">
        <div className="flex justify-center pt-10">
          <Logo size="lg" />
        </div>

        <HeroSection
          title="OPSYNC"
          subtitle={{
            regular: "Conectamos operações, ",
            gradient: "sincronizamos processos e impulsionamos resultados.",
          }}
          description="Chamados de manutenção acionados automaticamente pelo CLP, técnico certo notificado na hora e o histórico completo de cada máquina num só lugar."
          ctaText="Fazer login"
          ctaHref="#login-form"
        />

        <div
          id="login-form"
          className="animate-fade-up mx-auto grid w-full max-w-3xl scroll-mt-6 gap-6 px-4 pb-16 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl border border-base-700 bg-base-850 p-5"
          >
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="ex.: marina"
                className="w-full rounded-lg border border-base-600 bg-base-900 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-accent-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                placeholder="••••"
                className="w-full rounded-lg border border-base-600 bg-base-900 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-accent-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-critical-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !username || !senha}
              className="mt-1 rounded-lg bg-accent-600 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-accent-500 disabled:opacity-50"
            >
              {submitting ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="rounded-2xl border border-base-700 bg-base-850 p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Contas de teste
            </p>
            <p className="mb-3 text-xs text-slate-500">
              Uma por persona — clique para preencher o login.
            </p>
            <div className="flex flex-col gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => fillDemoAccount(account)}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-base-700 bg-base-900/60 px-3 py-2.5 text-left transition hover:border-accent-500 hover:bg-base-800"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-lg">{account.icon}</span>
                    <span>
                      <span className="block text-sm font-semibold text-white">
                        {account.nome}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {ROLE_LABELS[account.role]}
                      </span>
                    </span>
                  </span>
                  <span className="font-mono text-xs text-slate-400 group-hover:text-accent-400">
                    {account.username} / {account.senha}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
