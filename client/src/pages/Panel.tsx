import { useState } from "react";
import { api, useMachines, useSimulationStatus, useTickets } from "../lib/api";
import { TicketCard } from "../components/TicketCard";
import type { AuthUser, Prioridade } from "../lib/types";

const PRIORITY_ORDER: Record<Prioridade, number> = { Vermelho: 0, Amarelo: 1, Verde: 2 };

export function Panel({ user }: { user: AuthUser }) {
  const { tickets, refresh } = useTickets();
  const machines = useMachines();
  const { autoMode, setAutoMode } = useSimulationStatus();
  const [simulating, setSimulating] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const waiting = tickets
    .filter((t) => t.status === "aberto")
    .sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.prioridade] - PRIORITY_ORDER[b.prioridade];
      if (priorityDiff !== 0) return priorityDiff;
      return a.abertoEm < b.abertoEm ? -1 : 1;
    });

  async function handleSimulate() {
    setSimulating(true);
    try {
      await api.simulateTicket();
      await refresh();
    } finally {
      setSimulating(false);
    }
  }

  async function handleToggleAuto() {
    setToggling(true);
    try {
      const next = !autoMode;
      const result = await api.toggleSimulation(next);
      setAutoMode(result.autoMode);
    } finally {
      setToggling(false);
    }
  }

  async function handleClaim(id: string) {
    setClaimError(null);
    try {
      await api.claimTicket(id);
      await refresh();
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Erro ao assumir o chamado.");
      await refresh();
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-industrial text-2xl font-bold text-white">Painel de chamados</h1>
          <p className="mt-1 text-sm text-slate-400">
            Fila de máquinas esperando manutenção, ordenada por prioridade — visível ao mesmo
            tempo para todo mundo.
          </p>
        </div>

        {user.role === "team-leader" && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="rounded-lg border border-base-600 bg-base-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-accent-500 hover:text-white disabled:opacity-50"
            >
              {simulating ? "Simulando…" : "⚡ Simular incidente"}
            </button>
            <button
              onClick={handleToggleAuto}
              disabled={toggling}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                autoMode
                  ? "bg-ok-600 text-white hover:bg-ok-500"
                  : "border border-base-600 bg-base-800 text-slate-200 hover:border-accent-500 hover:text-white"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${autoMode ? "animate-pulse bg-white" : "bg-slate-500"}`}
              />
              Modo automático {autoMode ? "ligado" : "desligado"}
            </button>
          </div>
        )}
      </div>

      {claimError && (
        <p className="mt-4 rounded-lg border border-critical-600/40 bg-critical-600/10 px-3 py-2 text-sm text-critical-500">
          {claimError}
        </p>
      )}

      {waiting.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-semibold text-slate-300">Nenhum chamado aguardando</p>
          <p className="text-sm text-slate-500">
            Reporte um problema ou simule um incidente para ver o painel em ação.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {waiting.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              machine={machines.find((m) => m.nome === ticket.maquina)}
              onClaim={user.role === "manutencao" ? handleClaim : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
