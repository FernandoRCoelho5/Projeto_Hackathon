import { useEffect, useState } from "react";
import { api, useMachines } from "../lib/api";
import type { AuthUser, Machine, MaintenanceEvent } from "../lib/types";
import { Spec } from "../components/Spec";
import { MachineChip } from "../components/MachineChip";
import { MaintenanceEventsSection } from "../components/MaintenanceEventsSection";

const CRITICIDADE_LABELS = { alta: "Alta", media: "Média", baixa: "Baixa" } as const;
const CRITICIDADE_BADGE: Record<Machine["criticidade"], string> = {
  alta: "border-critical-500/40 bg-critical-500/10 text-critical-500",
  media: "border-warning-500/40 bg-warning-500/10 text-warning-400",
  baixa: "border-ok-500/40 bg-ok-500/10 text-ok-500",
};

export function Equipamentos({ user }: { user: AuthUser }) {
  const machines = useMachines();
  const [selecionada, setSelecionada] = useState("");
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const machine = machines.find((m) => m.nome === selecionada);

  useEffect(() => {
    setSelecionada((current) => current || machines[0]?.nome || "");
  }, [machines]);

  useEffect(() => {
    if (!selecionada) return;
    setLoading(true);
    api
      .getMaintenanceEvents(selecionada)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [selecionada]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-industrial text-2xl font-bold text-white">Equipamentos</h1>
      <p className="mt-1 text-sm text-slate-400">
        Armazém de máquinas — especificações, modificações registradas e relatórios de manutenção
        gerados para cada equipamento.
      </p>

      {machines.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">Carregando máquinas…</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {machines.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelecionada(m.nome)}
              className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${
                m.nome === selecionada
                  ? "border-accent-500 bg-accent-500/10"
                  : "border-base-700 bg-base-850 hover:border-base-600"
              }`}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="font-industrial font-bold text-white">{m.nome}</span>
                <span
                  className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CRITICIDADE_BADGE[m.criticidade]}`}
                >
                  {CRITICIDADE_LABELS[m.criticidade]}
                </span>
              </div>
              <MachineChip machine={m} />
              <span className="text-xs text-slate-500">
                {m.fabricante} · {m.modelo}
              </span>
            </button>
          ))}
        </div>
      )}

      {machine && (
        <div className="mt-8">
          <h2 className="font-industrial text-xl font-bold text-white">{machine.nome}</h2>

          <div className="mt-4 grid gap-3 rounded-xl border border-base-700 bg-base-850 p-5 sm:grid-cols-2 lg:grid-cols-5">
            <Spec label="Setor" value={machine.setor} />
            <Spec label="Modelo" value={machine.modelo} />
            <Spec label="Fabricante" value={machine.fabricante} />
            <Spec
              label="Instalada em"
              value={new Date(machine.instaladaEm).toLocaleDateString("pt-BR")}
            />
            <Spec label="Criticidade" value={CRITICIDADE_LABELS[machine.criticidade]} />
          </div>

          <div className="mt-8">
            {loading ? (
              <p className="text-sm text-slate-500">Carregando histórico…</p>
            ) : (
              <MaintenanceEventsSection
                maquina={machine.nome}
                events={events}
                canEdit={user.role === "administrador"}
                onCreated={(event) => setEvents((current) => [event, ...current])}
                title="Modificações e relatórios"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
