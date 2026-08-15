import { useState } from "react";
import { api, BASE } from "../lib/api";
import type { MaintenanceEvent, TipoEventoManutencao } from "../lib/types";
import { formatDateTime } from "../lib/format";

const TIPO_LABELS: Record<TipoEventoManutencao, string> = {
  reparo: "Reparo",
  troca_peca: "Troca de peça",
  preventiva: "Manutenção preventiva",
  outro: "Outro",
};

export function MaintenanceEventsSection({
  maquina,
  events,
  canEdit,
  onCreated,
  title = "Eventos de manutenção",
}: {
  maquina: string;
  events: MaintenanceEvent[];
  canEdit: boolean;
  onCreated: (event: MaintenanceEvent) => void;
  title?: string;
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
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          {title} ({events.length})
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
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                  Registrado por {event.registradoPor.nome}
                </p>
                <a
                  href={`${BASE}/documents/relatorio-manutencao/${event.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-900/60 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:border-accent-500 hover:text-white"
                >
                  📄 Relatório
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
