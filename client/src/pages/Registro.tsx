import { useEffect, useState } from "react";
import { api, useMachines } from "../lib/api";
import type { AuthUser, Dossie, MaintenanceEvent } from "../lib/types";
import { formatDateTime, formatDurationShort } from "../lib/format";
import { StatTile } from "../components/StatTile";
import { MachineChip } from "../components/MachineChip";
import { Spec } from "../components/Spec";
import { MaintenanceEventsSection } from "../components/MaintenanceEventsSection";

const CRITICIDADE_LABELS = { alta: "Alta", media: "Média", baixa: "Baixa" } as const;

export function Registro({ user }: { user: AuthUser }) {
  const machines = useMachines();
  const [setor, setSetor] = useState("");
  const [maquina, setMaquina] = useState("");
  const [dossie, setDossie] = useState<Dossie | null>(null);
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const sectors = Array.from(new Set(machines.map((m) => m.setor)));
  const machinesInSector = machines.filter((m) => m.setor === setor);
  const machine = machines.find((m) => m.nome === maquina);

  useEffect(() => {
    setSetor((current) => current || machines[0]?.setor || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machines.length]);

  useEffect(() => {
    if (!setor) return;
    const inSector = machines.filter((m) => m.setor === setor);
    if (inSector.length > 0 && !inSector.some((m) => m.nome === maquina)) {
      setMaquina(inSector[0].nome);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setor, machines.length]);

  async function loadMachineData(nome: string) {
    setLoading(true);
    try {
      const [dossieData, eventsData] = await Promise.all([
        api.getDossie(nome),
        api.getMaintenanceEvents(nome),
      ]);
      setDossie(dossieData);
      setEvents(eventsData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!maquina) return;
    loadMachineData(maquina);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maquina]);

  const recurring = dossie
    ? Object.values(
        dossie.chamados.reduce<Record<string, { chave: string; label: string; count: number }>>(
          (acc, c) => {
            const chave = c.codigoFalha ?? c.descricao;
            if (!acc[chave]) {
              acc[chave] = {
                chave,
                label: c.codigoFalha ? `${c.codigoFalha} · ${c.descricao}` : c.descricao,
                count: 0,
              };
            }
            acc[chave].count += 1;
            return acc;
          },
          {},
        ),
      ).sort((a, b) => b.count - a.count)
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-industrial text-2xl font-bold text-white">Registro de manutenção</h1>
      <p className="mt-1 text-sm text-slate-400">
        Máquinas por setor, com histórico de chamados, problemas recorrentes e eventos de
        manutenção registrados.
      </p>

      {machines.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">Carregando máquinas…</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setSetor(s)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  s === setor
                    ? "bg-accent-600 text-white"
                    : "border border-base-600 bg-base-800 text-slate-300 hover:border-accent-500 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {machinesInSector.map((m) => (
              <button
                key={m.id}
                onClick={() => setMaquina(m.nome)}
                className={`flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition ${
                  m.nome === maquina
                    ? "border-accent-500 bg-accent-500/10"
                    : "border-base-700 bg-base-850 hover:border-base-600"
                }`}
              >
                <span className="font-industrial font-bold text-white">{m.nome}</span>
                <MachineChip machine={m} />
              </button>
            ))}
          </div>
        </>
      )}

      {machine && (
        <div className="mt-6 grid gap-3 rounded-xl border border-base-700 bg-base-850 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Spec label="Setor" value={machine.setor} />
          <Spec label="Modelo" value={machine.modelo} />
          <Spec label="Fabricante" value={machine.fabricante} />
          <Spec label="Criticidade" value={CRITICIDADE_LABELS[machine.criticidade]} />
        </div>
      )}

      {loading || !dossie ? (
        <p className="mt-8 text-sm text-slate-500">Carregando…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <StatTile
              label="MTTR médio"
              value={dossie.mttrMedioMs !== null ? formatDurationShort(dossie.mttrMedioMs) : "—"}
              hint="Tempo médio para resolver um chamado"
            />
            <StatTile
              label="MTBF (simplificado)"
              value={dossie.mtbfMs !== null ? formatDurationShort(dossie.mtbfMs) : "—"}
              hint={
                dossie.mtbfMs !== null
                  ? "Tempo médio entre chamados"
                  : "Precisa de 2+ chamados encerrados"
              }
            />
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Problemas recorrentes
            </h2>
            {recurring.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum problema recorrente identificado ainda para esta máquina.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recurring.map((r) => (
                  <li
                    key={r.chave}
                    className="flex items-center justify-between gap-3 rounded-lg border border-base-700 bg-base-850 px-3 py-2.5 text-sm"
                  >
                    <span className="text-slate-200">{r.label}</span>
                    <span
                      className={`whitespace-nowrap text-xs font-bold uppercase tracking-wide ${
                        r.count >= 2 ? "text-warning-400" : "text-slate-500"
                      }`}
                    >
                      {r.count}x{r.count >= 2 ? " · recorrente" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Histórico de chamados encerrados ({dossie.chamados.length})
            </h2>

            {dossie.chamados.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum chamado encerrado ainda para esta máquina.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-base-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-base-800 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5">Chamado</th>
                      <th className="px-4 py-2.5">Aberto em</th>
                      <th className="px-4 py-2.5">Encerrado em</th>
                      <th className="px-4 py-2.5 text-right">MTTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossie.chamados.map((c) => (
                      <tr key={c.id} className="border-t border-base-700 bg-base-850">
                        <td className="px-4 py-2.5 text-slate-200">
                          {c.codigoFalha ? `${c.codigoFalha} · ` : ""}
                          {c.descricao}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">{formatDateTime(c.abertoEm)}</td>
                        <td className="px-4 py-2.5 text-slate-400">
                          {formatDateTime(c.fechadoEm)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-accent-400">
                          {formatDurationShort(c.mttrMs)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-8">
            <MaintenanceEventsSection
              maquina={maquina}
              events={events}
              canEdit={user.role === "administrador"}
              onCreated={(event) => setEvents((current) => [event, ...current])}
            />
          </div>
        </>
      )}
    </div>
  );
}
