import { useEffect, useState } from "react";
import { formatDuration } from "../lib/format";

export function Timer({ since }: { since: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = now - new Date(since).getTime();

  return (
    <span className="font-mono text-lg font-semibold tabular-nums text-accent-400">
      {formatDuration(elapsed)}
    </span>
  );
}
