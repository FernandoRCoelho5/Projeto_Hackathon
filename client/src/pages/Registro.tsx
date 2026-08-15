import { useEffect, useState } from "react";
import { api, useMachines } from "../lib/api";
import type { AuthUser, Dossie, MaintenanceEvent, TipoEventoManutencao } from "../lib/types";
import { formatDateTime, formatDurationShort } from "../lib/format";
import { StatTile } from "../components/StatTile";

const FALLBACK_MACHINES = ["Linha 1 - Solda", "Linha 2 - Pintura", "Linha 3 - Montagem"];

const TIPO_LABELS: Record<TipoEventoManutencao, string> = {
  reparo: "Reparo",
  troca_peca: "Troca de peça",
  preventiva: "Manutenção preventiva",
  outro: "Outro",
};

const CRITICIDADE_LABELS = { alta: "Alta", media: "Média", baixa: "Baixa" } as const;

export function Registro({ user }: { user: AuthUser }) {
  const machines = useMachines();
  const [maquina, setMaquina] = useState("");
  const [dossie, setDossie] = useState<Dossie | null>(null);
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const machineNames = machines.length > 0 ? machines.map((m) => m.nome) : FALLBACK_MACHINES;
  const machine = machines.find((m) => m.nome === maquina);

  useEffect(() => {
    setMaquina((current) => current || machineNames[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machines.length]);

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-industrial text-2xl font-bold text-white">Registro de manutenção</h1>
      <p className="mt-1 text-sm text-slate-400">
        Especificações da máquina, histórico de chamados e eventos de manutenção registrados.
      </p>

      <select
        value={maquina}
        onChange={(e) => setMaquina(e.target.value)}
        className="mt-6 w-full max-w-sm rounded-lg border border-base-600 bg-base-850 px-3 py-2.5 text-white focus:border-accent-500 focus:outline-none sm:w-auto"
      >
        {machineNames.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

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

          <MaintenanceEventsSection
            maquina={maquina}
            events={events}
            canEdit={user.role === "team-leader"}
            onCreated={(event) => setEvents((current) => [event, ...current])}
          />
        </>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function MaintenanceEventsSection({
  maquina,
  events,
  canEdit,
  onCreated,
}: {
  maquina: string;
  events: MaintenanceEvent[];
  canEdit: boolean;
  onCreated: (event: MaintenanceEvent) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState<TipoEventoManutencao>("reparo");
  const [descricao, setDescricao] = useState("");
  const [pecas, setPecas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const pecasTrocadas = pecas
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const event = await api.createMaintenanceEvent(maquina, {
        tipo,
        descricao: descricao.trim(),
        pecasTrocadas: pecasTrocadas.length > 0 ? pecasTrocadas : undefined,
      });
      onCreated(event);
      setDescricao("");
      setPecas("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar evento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Eventos de manutenção ({events.length})
        </h2>
        {canEdit && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg border border-base-600 bg-base-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-accent-500 hover:text-white"
          >
            {showForm ? "Cancelar" : "+ Registrar evento"}
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 flex flex-col gap-3 rounded-xl border border-base-700 bg-base-850 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Tipo
              </span>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoEventoManutencao)}
                className="w-full rounded-lg border border-base-600 bg-base-900 px-3 py-2.5 text-white focus:border-accent-500 focus:outline-none"
              >
                {(Object.keys(TIPO_LABELS) as TipoEventoManutencao[]).map((t) => (
                  <option key={t} value={t}>
                    {TIPO_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Peças trocadas (opcional, separadas por vírgula)
              </span>
              <input
                type="text"
                value={pecas}
                onChange={(e) => setPecas(e.target.value)}
                placeholder="Ex.: rolamento, correia"
                className="w-full rounded-lg border border-base-600 bg-base-900 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-accent-500 focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Descrição
            </span>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              required
              placeholder="O que foi feito na máquina"
              className="w-full resize-none rounded-lg border border-base-600 bg-base-900 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-accent-500 focus:outline-none"
            />
          </label>

          {error && <p className="text-sm text-critical-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded-lg bg-accent-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-accent-500 disabled:opacity-50"
          >
            {submitting ? "Salvando…" : "Salvar evento"}
          </button>
        </form>
      )}

      {events.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum evento registrado ainda para esta máquina.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-base-700 bg-base-850 p-4 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-500/40 bg-accent-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-accent-400">
                  {TIPO_LABELS[event.tipo]}
                </span>
                <span className="text-xs text-slate-500">{formatDateTime(event.criadoEm)}</span>
              </div>
              <p className="mt-2 text-slate-200">{event.descricao}</p>
              {event.pecasTrocadas && event.pecasTrocadas.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  Peças: {event.pecasTrocadas.join(", ")}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Registrado por {event.registradoPor.nome}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
