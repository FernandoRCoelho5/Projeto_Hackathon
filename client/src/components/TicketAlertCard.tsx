import { Countdown } from "./Countdown";
import { TicketCard } from "./TicketCard";
import type { Machine, Ticket } from "../lib/types";

export const ACCEPT_WINDOW_MS = 90_000;

// Cores seguem a prioridade real do chamado (mesma lógica do PriorityBadge),
// não uma cor de urgência fixa — senão um chamado Verde some destacado em
// vermelho, dando a entender prioridade crítica que ele não tem.
const ALERT_STYLES: Record<Ticket["prioridade"], { box: string; text: string; dot: string }> = {
  Vermelho: {
    box: "border-critical-500/70 bg-critical-500/5 shadow-critical-500/10",
    text: "text-critical-500",
    dot: "bg-critical-500",
  },
  Amarelo: {
    box: "border-warning-500/70 bg-warning-500/5 shadow-warning-500/10",
    text: "text-warning-400",
    dot: "bg-warning-400",
  },
  Verde: {
    box: "border-ok-500/70 bg-ok-500/5 shadow-ok-500/10",
    text: "text-ok-500",
    dot: "bg-ok-500",
  },
};

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
  const style = ALERT_STYLES[ticket.prioridade];

  return (
    <div className={`rounded-xl border-2 p-3 shadow-lg ${style.box}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${style.text}`}>
          <span className={`h-2 w-2 animate-pulse rounded-full ${style.dot}`} />
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
