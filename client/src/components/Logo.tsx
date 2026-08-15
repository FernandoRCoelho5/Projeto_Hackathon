export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7 13c0-4.2 3.3-7.4 8.3-7.4 4.6 0 7.2 2.2 8.2 5.4"
        stroke="var(--color-accent-500)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M20.5 7.6l4.3 1.7-2 4.3z" fill="var(--color-accent-500)" />
      <path
        d="M25 19c0 4.2-3.3 7.4-8.3 7.4-4.6 0-7.2-2.2-8.2-5.4"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M11.5 24.4l-4.3-1.7 2-4.3z" fill="#ffffff" />
    </svg>
  );
}

export function Logo({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const iconSize = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-12 w-12" : "h-8 w-8";
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-3xl" : "text-lg";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark className={iconSize} />
      <span className={`font-industrial ${textSize} font-extrabold tracking-wide text-white`}>
        Op<span className="text-accent-400">Sync</span>
      </span>
    </div>
  );
}
