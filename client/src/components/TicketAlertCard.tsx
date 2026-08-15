import { Countdown } from "./Countdown";
import { TicketCard } from "./TicketCard";
import type { Machine, Ticket } from "../lib/types";

export const ACCEPT_WINDOW_MS = 90_000;

export function TicketAlertCard({
  ticket,
  machine,
  onClaim,
  onDismiss,
}: {
  ticket: Ticket;
  machine?: Machine;
  onClaim: (id: string) => Promise<void> | void;
  onDismiss: (id: string) => void;
}) {
  const deadline = new Date(ticket.abertoEm).getTime() + ACCEPT_WINDOW_MS;

  return (
    <div className="rounded-xl border-2 border-critical-500/70 bg-critical-500/5 p-3 shadow-lg shadow-critical-500/10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-critical-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-critical-500" />
          Chamado para você · responda em
        </span>
        <div className="flex items-center gap-3">
          <Countdown deadline={deadline} onExpire={() => onDismiss(ticket.id)} />
          <button
            onClick={() => onDismiss(ticket.id)}
            className="rounded-lg border border-base-600 bg-base-900/60 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:border-critical-500 hover:text-white"
          >
            Recusar
          </button>
        </div>
      </div>
      <TicketCard ticket={ticket} machine={machine} onClaim={onClaim} />
    </div>
  );
}
