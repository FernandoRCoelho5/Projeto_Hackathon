import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { StatTile } from "../components/StatTile";
import { formatCurrencyBRL, formatDurationShort } from "../lib/format";

const DEFAULTS = {
  carrosPorHora: 40,
  valorPorCarro: 8000,
  paradasPorMes: 6,
  tempoMedioAtualMin: 45,
};

export function Calculator() {
  const [carrosPorHora, setCarrosPorHora] = useState(DEFAULTS.carrosPorHora);
  const [valorPorCarro, setValorPorCarro] = useState(DEFAULTS.valorPorCarro);
  const [paradasPorMes, setParadasPorMes] = useState(DEFAULTS.paradasPorMes);
  const [tempoMedioAtualMin, setTempoMedioAtualMin] = useState(DEFAULTS.tempoMedioAtualMin);
  const [realMttr, setRealMttr] = useState<{ averageMs: number | null; count: number }>({
    averageMs: null,
    count: 0,
  });

  useEffect(() => {
    const refresh = () => api.getRealDemoMttr().then(setRealMttr).catch(() => {});
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, []);

  const horasAtual = tempoMedioAtualMin / 60;
  const perdaMensalAtual = horasAtual * carrosPorHora * valorPorCarro * paradasPorMes;

  const horasReal = realMttr.averageMs !== null ? realMttr.averageMs / 3_600_000 : null;
  const perdaMensalReal =
    horasReal !== null ? horasReal * carrosPorHora * valorPorCarro * paradasPorMes : null;

  const economiaMensal = perdaMensalReal !== null ? perdaMensalAtual - perdaMensalReal : null;
  const barReal = perdaMensalReal !== null ? Math.min(100, (perdaMensalReal / perdaMensalAtual) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-industrial text-2xl font-bold text-white">Calculadora de impacto</h1>
      <p className="mt-1 text-sm text-slate-400">
        O prejuízo não é a quebra — é o lucro cessante da produção parada. Ajuste os números da
        sua linha para ver o tamanho do problema.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field
          label="Carros produzidos por hora"
          value={carrosPorHora}
          onChange={setCarrosPorHora}
          min={1}
        />
        <Field
          label="Valor / margem por carro (R$)"
          value={valorPorCarro}
          onChange={setValorPorCarro}
          min={0}
          step={100}
        />
        <Field
          label="Paradas desse tipo por mês"
          value={paradasPorMes}
          onChange={setParadasPorMes}
          min={0}
        />
        <Field
          label="Tempo médio atual (minutos)"
          value={tempoMedioAtualMin}
          onChange={setTempoMedioAtualMin}
          min={10}
          max={120}
          hint="Hoje: de 10 min a 2h, do aviso até a manutenção chegar"
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <StatTile
          label="Lucro cessante mensal hoje"
          value={formatCurrencyBRL(perdaMensalAtual)}
          hint={`Com ${tempoMedioAtualMin} min de parada média por chamado`}
          tone="critical"
        />
        <StatTile
          label="Lucro cessante mensal com Aciona"
          value={perdaMensalReal !== null ? formatCurrencyBRL(perdaMensalReal) : "—"}
          hint={
            realMttr.count > 0
              ? `MTTR real da demo: ${formatDurationShort(realMttr.averageMs ?? 0)} (${realMttr.count} chamado${realMttr.count > 1 ? "s" : ""} encerrado${realMttr.count > 1 ? "s" : ""})`
              : "Encerre um chamado no Painel para calcular com dado real"
          }
          tone="accent"
        />
      </div>

      <div className="mt-4">
        <StatTile
          label="Economia mensal estimada"
          value={economiaMensal !== null ? formatCurrencyBRL(economiaMensal) : "—"}
          hint={
            economiaMensal !== null
              ? "Diferença entre o processo atual e o MTTR real com o Aciona"
              : "Aparece assim que houver um chamado encerrado nesta sessão"
          }
          tone="ok"
        />
      </div>

      {perdaMensalReal !== null && (
        <div className="mt-8 rounded-xl border border-base-700 bg-base-850 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Comparação mensal
          </p>
          <div className="space-y-3">
            <BarRow
              label="Hoje (sem Aciona)"
              value={formatCurrencyBRL(perdaMensalAtual)}
              widthPct={100}
              colorClass="bg-critical-500"
            />
            <BarRow
              label="Com Aciona"
              value={formatCurrencyBRL(perdaMensalReal)}
              widthPct={barReal}
              colorClass="bg-ok-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-base-600 bg-base-850 px-3 py-2.5 font-mono text-white focus:border-accent-500 focus:outline-none"
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function BarRow({
  label,
  value,
  widthPct,
  colorClass,
}: {
  label: string;
  value: string;
  widthPct: number;
  colorClass: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="font-mono font-semibold text-white">{value}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-base-900">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${Math.max(2, widthPct)}%` }}
        />
      </div>
    </div>
  );
}
