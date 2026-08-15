import { useEffect, useState } from "react";

export function Countdown({
  deadline,
  onExpire,
}: {
  deadline: number;
  onExpire?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, deadline - now);

  useEffect(() => {
    if (remainingMs === 0) onExpire?.();
  }, [remainingMs, onExpire]);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const urgent = remainingMs <= 20_000;

  return (
    <span
      className={`font-mono text-lg font-bold tabular-nums ${urgent ? "text-critical-500" : "text-white"}`}
    >
      {m}:{String(s).padStart(2, "0")}
    </span>
  );
}
