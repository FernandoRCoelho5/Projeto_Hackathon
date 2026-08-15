import type { Prioridade } from "../lib/types";

const STYLES: Record<Prioridade, { label: string; classes: string; dot: string }> = {
  Vermelho: {
    label: "Crítico",
    classes: "bg-critical-600/15 text-critical-500 border-critical-600/40",
    dot: "bg-critical-500",
  },
  Amarelo: {
    label: "Atenção",
    classes: "bg-warning-500/15 text-warning-400 border-warning-500/40",
    dot: "bg-warning-400",
  },
  Verde: {
    label: "Preventivo",
    classes: "bg-ok-500/15 text-ok-500 border-ok-500/40",
    dot: "bg-ok-500",
  },
};

export function PriorityBadge({ prioridade }: { prioridade: Prioridade }) {
  const s = STYLES[prioridade];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${s.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label} · {prioridade}
    </span>
  );
}
