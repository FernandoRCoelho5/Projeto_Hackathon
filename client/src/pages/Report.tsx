import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, useMachines } from "../lib/api";

const FALLBACK_MACHINES = ["Linha 1 - Solda", "Linha 2 - Pintura", "Linha 3 - Montagem"];

export function Report() {
  const navigate = useNavigate();
  const machines = useMachines();
  const machineNames = machines.length > 0 ? machines.map((m) => m.nome) : FALLBACK_MACHINES;
  const [maquina, setMaquina] = useState("");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMaquina((current) => current || machineNames[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machines.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!maquina || !descricao.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createTicket(maquina, descricao.trim());
      setDescricao("");
      navigate("/painel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reportar o problema.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-industrial text-2xl font-bold text-white">Reportar problema</h1>
      <p className="mt-1 text-sm text-slate-400">
        Descreva o que está acontecendo. A prioridade, a especialidade e o checklist inicial são
        classificados automaticamente.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Máquina / linha
          </label>
          <select
            value={maquina}
            onChange={(e) => setMaquina(e.target.value)}
            className="w-full rounded-lg border border-base-600 bg-base-850 px-3 py-2.5 text-white focus:border-accent-500 focus:outline-none"
          >
            {machineNames.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Descreva o problema
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: barulho estranho no motor, vibrando mais que o normal"
            rows={5}
            required
            className="w-full resize-none rounded-lg border border-base-600 bg-base-850 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-accent-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-critical-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent-600 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-accent-500 disabled:opacity-50"
        >
          {submitting ? "Classificando com IA…" : "Reportar"}
        </button>
      </form>
    </div>
  );
}
