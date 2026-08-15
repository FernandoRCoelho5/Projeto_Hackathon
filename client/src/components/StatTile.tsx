export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "critical" | "ok" | "accent";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-white",
    critical: "text-critical-500",
    ok: "text-ok-500",
    accent: "text-accent-400",
  };

  return (
    <div className="rounded-xl border border-base-700 bg-base-850 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 font-mono text-3xl font-bold ${toneClasses[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
