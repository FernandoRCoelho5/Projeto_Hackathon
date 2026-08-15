import { useState } from "react";
import type { Machine, Ticket } from "../lib/types";
import { PriorityBadge } from "./PriorityBadge";
import { SpecialtyBadge } from "./SpecialtyBadge";
import { MachineChip } from "./MachineChip";
import { Timer } from "./Timer";
import { formatDateTime } from "../lib/format";
import { BASE } from "../lib/api";

const PRIORITY_RING: Record<Ticket["prioridade"], string> = {
  Vermelho: "border-l-critical-500",
  Amarelo: "border-l-warning-400",
  Verde: "border-l-ok-500",
};

export function TicketCard({
  ticket,
  machine,
  onClaim,
  onClose,
  disabledCloseReason,
}: {
  ticket: Ticket;
  machine?: Machine;
  onClaim?: (id: string) => Promise<void> | void;
  onClose?: (id: string) => Promise<void> | void;
  disabledCloseReason?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClaim() {
    if (!onClaim) return;
    setBusy(true);
    try {
      await onClaim(ticket.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    if (!onClose) return;
    setBusy(true);
    try {
      await onClose(ticket.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-base-700 border-l-4 bg-base-850 p-4 shadow-lg shadow-black/20 ${PRIORITY_RING[ticket.prioridade]}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-industrial text-lg font-bold text-white">{ticket.maquina}</p>
          <p className="text-sm text-slate-400">
            Aberto às {formatDateTime(ticket.abertoEm)}
            {ticket.codigoFalha ? ` · ${ticket.codigoFalha}` : ""}
          </p>
        </div>
        {ticket.status !== "fechado" && <Timer since={ticket.abertoEm} />}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge prioridade={ticket.prioridade} />
        <SpecialtyBadge especialidade={ticket.especialidade} />
        {machine && <MachineChip machine={machine} />}
        {ticket.origem === "simulado" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/40 bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Modo simulação · {ticket.tipoSimulacao === "reativo" ? "parada reativa" : "alerta preventivo"}
          </span>
        )}
      </div>

      <p className="text-sm text-slate-300">{ticket.descricao}</p>

      {ticket.telemetria.length > 0 && (
        <div className="rounded-lg border border-base-700 bg-base-900/60 p-2.5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Telemetria
          </p>
          <ul className="space-y-0.5 font-mono text-xs text-slate-300">
            {ticket.telemetria.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {ticket.checklist.length > 0 && (
        <div className="rounded-lg border border-base-700 bg-base-900/60 p-2.5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Checklist inicial
          </p>
          <ul className="space-y-0.5 text-xs text-slate-300">
            {ticket.checklist.map((c) => (
              <li key={c} className="flex gap-1.5">
                <span className="text-accent-400">•</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`${BASE}/documents/manual/${encodeURIComponent(ticket.maquina)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-900/60 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:border-accent-500 hover:text-white"
        >
          📘 Manual da máquina
        </a>
        <a
          href={`${BASE}/documents/protocolo?especialidade=${encodeURIComponent(ticket.especialidade)}${ticket.codigoFalha ? `&codigo=${encodeURIComponent(ticket.codigoFalha)}` : ""}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-900/60 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:border-accent-500 hover:text-white"
        >
          📗 Protocolo de correção
        </a>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-base-700 pt-3">
        <p className="text-sm text-slate-300">
          {ticket.assumidoPor ? (
            <>
              Assumido por: <span className="font-semibold text-white">{ticket.assumidoPor.nome}</span>
            </>
          ) : (
            <>
              Sugestão: <span className="font-semibold text-white">{ticket.tecnico.nome}</span>
            </>
          )}
        </p>

        {ticket.status === "fechado" ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-ok-500">
              MTTR: {ticket.mttrMs !== null ? Math.round(ticket.mttrMs / 60000) : "—"} min
            </span>
            <a
              href={`${BASE}/documents/relatorio-chamado/${ticket.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-900/60 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:border-accent-500 hover:text-white"
            >
              📄 Relatório
            </a>
          </div>
        ) : onClose ? (
          <button
            onClick={handleClose}
            disabled={busy}
            className="rounded-lg bg-accent-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-500 disabled:opacity-50"
          >
            {busy ? "Encerrando…" : "Encerrar chamado"}
          </button>
        ) : onClaim ? (
          <button
            onClick={handleClaim}
            disabled={busy}
            className="rounded-lg bg-accent-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-500 disabled:opacity-50"
          >
            {busy ? "Assumindo…" : "Assumir chamado"}
          </button>
        ) : disabledCloseReason ? (
          <span className="text-xs font-semibold text-slate-500">{disabledCloseReason}</span>
        ) : null}
      </div>
    </div>
  );
}
