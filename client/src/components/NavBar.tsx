import { NavLink } from "react-router-dom";
import { ROLE_LABELS } from "../lib/auth";
import type { AuthUser, Role } from "../lib/types";

const LINKS: { to: string; label: string; roles: Role[] }[] = [
  { to: "/painel", label: "Painel", roles: ["funcionario", "team-leader", "manutencao"] },
  { to: "/reportar", label: "Reportar", roles: ["funcionario", "team-leader"] },
  { to: "/em-andamento", label: "Em andamento", roles: ["manutencao", "team-leader"] },
  { to: "/registro", label: "Registro", roles: ["funcionario", "team-leader", "manutencao"] },
  { to: "/calculadora", label: "Impacto", roles: ["team-leader"] },
];

export function NavBar({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const links = LINKS.filter((link) => link.roles.includes(user.role));

  return (
    <header className="sticky top-0 z-20 border-b border-base-700 bg-base-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-600 font-mono text-sm font-bold text-white">
            A
          </div>
          <span className="font-industrial text-lg font-extrabold tracking-wide text-white">
            ACIONA
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-accent-600 text-white"
                    : "text-slate-400 hover:bg-base-800 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 rounded-lg border border-base-600 bg-base-800 px-3 py-1.5 text-xs font-semibold text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-ok-500" />
            {user.nome}
            <span className="text-slate-500">· {ROLE_LABELS[user.role]}</span>
          </span>
          <button
            onClick={onLogout}
            className="rounded-lg border border-base-600 bg-base-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-critical-500 hover:text-white"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
