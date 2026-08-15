import type { Especialidade } from "../lib/types";

const ICONS: Record<Especialidade, string> = {
  Elétrica: "⚡",
  Mecânica: "⚙",
  Hidráulica: "💧",
};

export function SpecialtyBadge({ especialidade }: { especialidade: Especialidade }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-base-600/60 bg-base-800 px-2.5 py-1 text-xs font-medium text-slate-300">
      <span aria-hidden>{ICONS[especialidade]}</span>
      {especialidade}
    </span>
  );
}
