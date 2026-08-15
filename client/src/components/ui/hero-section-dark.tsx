import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: {
    regular: string;
    gradient: string;
  };
  description?: string;
  ctaText?: string;
  ctaHref?: string;
}

interface RetroGridProps {
  angle?: number;
  cellSize?: number;
  opacity?: number;
  lineColor?: string;
}

/**
 * Fundo animado (glow radial + grid em perspectiva). Renderizado uma vez por
 * página, atrás de todo o conteúdo — não só do hero — para que a tonalidade
 * não corte pra preto chapado assim que o hero termina.
 */
const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.35,
  lineColor = "var(--color-base-600)",
}: RetroGridProps) => {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--line-color": lineColor,
  } as React.CSSProperties;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute top-0 h-full w-full bg-accent-600/10 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(59,125,255,0.2),rgba(5,7,13,0))]" />
      <div
        className={cn("absolute size-full overflow-hidden perspective-[200px]", "opacity-(--opacity)")}
        style={gridStyles}
      >
        <div className="absolute inset-0 transform-[rotateX(var(--grid-angle))]">
          <div className="animate-grid bg-[linear-gradient(to_right,var(--line-color)_1px,transparent_0),linear-gradient(to_bottom,var(--line-color)_1px,transparent_0)] bg-repeat bg-size-[var(--cell-size)_var(--cell-size)] h-[300vh] inset-[0%_0px] ml-[-200%] origin-[100%_0_0] w-[600vw]" />
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-base-950 to-transparent to-90%" />
      </div>
    </div>
  );
};

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      className,
      title = "OPSYNC",
      subtitle = {
        regular: "Conectamos operações, ",
        gradient: "sincronizamos processos e impulsionamos resultados.",
      },
      description = "Chamados de manutenção acionados automaticamente pelo CLP, técnico certo notificado na hora e o histórico completo de cada máquina num só lugar.",
      ctaText = "Fazer login",
      ctaHref = "#login-form",
      ...props
    },
    ref,
  ) => {
    return (
      <section className={cn("relative z-10 mx-auto max-w-full", className)} ref={ref} {...props}>
        <div className="z-10 mx-auto max-w-7xl gap-12 px-4 py-20 md:px-8">
            <div className="mx-auto max-w-3xl space-y-5 text-center leading-0 lg:leading-5">
              <h1 className="font-industrial group mx-auto w-fit rounded-3xl border border-base-700 bg-base-800/60 px-5 py-2 text-sm text-slate-400">
                {title}
                <ChevronRight className="ml-2 inline h-4 w-4 duration-300 group-hover:translate-x-1" />
              </h1>
              <h2 className="font-industrial mx-auto bg-linear-to-b from-white to-white/70 bg-clip-text text-4xl tracking-tighter text-transparent md:text-6xl">
                {subtitle.regular}
                <span className="bg-linear-to-r from-accent-400 to-accent-600 bg-clip-text text-transparent">
                  {subtitle.gradient}
                </span>
              </h2>
              <p className="mx-auto max-w-2xl text-slate-400">{description}</p>
              <div className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0">
                <span className="relative inline-block overflow-hidden rounded-full p-[1.5px]">
                  <span className="absolute inset-[-1000%] animate-[spin_2.5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#5b9dff_0%,#141b2d_50%,#5b9dff_100%)]" />
                  <div className="inline-flex h-full w-full items-center justify-center rounded-full bg-base-900 text-xs font-medium backdrop-blur-3xl">
                    <a
                      href={ctaHref}
                      className="group inline-flex w-full items-center justify-center rounded-full border border-base-600 bg-base-800 px-10 py-4 text-center font-bold uppercase tracking-wide text-white transition-all hover:bg-accent-600 sm:w-auto"
                    >
                      {ctaText}
                      <ChevronRight className="ml-1 inline h-4 w-4 duration-300 group-hover:translate-x-1" />
                    </a>
                  </div>
                </span>
              </div>
            </div>
        </div>
      </section>
    );
  },
);
HeroSection.displayName = "HeroSection";

export { HeroSection, RetroGrid };
