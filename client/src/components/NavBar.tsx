import { NavLink } from "react-router-dom";
import { ROLE_LABELS } from "../lib/auth";
import type { AuthUser, Role } from "../lib/types";
import { Logo } from "./Logo";

const LINKS: { to: string; label: string; roles: Role[] }[] = [
  { to: "/painel", label: "Painel", roles: ["administrador", "tecnico"] },
  { to: "/em-andamento", label: "Em andamento", roles: ["administrador", "tecnico"] },
  { to: "/registro", label: "Registro", roles: ["administrador", "tecnico"] },
  { to: "/equipamentos", label: "Equipamentos", roles: ["administrador", "tecnico"] },
  { to: "/calculadora", label: "Impacto", roles: ["administrador"] },
];

export function NavBar({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const links = LINKS.filter((link) => link.roles.includes(user.role));
  const roleLabel = user.especialidade
    ? `${ROLE_LABELS[user.role]} · ${user.especialidade}`
    : ROLE_LABELS[user.role];

  return (
    <header className="sticky top-0 z-20 border-b border-base-700 bg-base-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Logo />

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
            <span className="text-slate-500">· {roleLabel}</span>
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
