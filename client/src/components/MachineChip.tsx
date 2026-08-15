import type { Machine } from "../lib/types";

const CRITICALITY_DOT: Record<Machine["criticidade"], string> = {
  alta: "bg-critical-500",
  media: "bg-warning-400",
  baixa: "bg-ok-500",
};

const CRITICALITY_LABEL: Record<Machine["criticidade"], string> = {
  alta: "Criticidade alta",
  media: "Criticidade média",
  baixa: "Criticidade baixa",
};

export function MachineChip({ machine }: { machine: Machine }) {
  return (
    <span
      title={`${CRITICALITY_LABEL[machine.criticidade]} · ${machine.modelo}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-base-600/60 bg-base-800 px-2.5 py-1 text-xs font-medium text-slate-300"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${CRITICALITY_DOT[machine.criticidade]}`} />
      {machine.setor}
    </span>
  );
}
