import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ROLE_LABELS } from "../lib/auth";
import type { AuthUser, Especialidade, Role } from "../lib/types";

const ESPECIALIDADES: Especialidade[] = ["Elétrica", "Mecânica", "Hidráulica"];

export function Usuarios() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<Role>("tecnico");
  const [especialidade, setEspecialidade] = useState<Especialidade>("Elétrica");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await api.createUser({
        nome: nome.trim(),
        username: username.trim(),
        senha,
        role,
        especialidade: role === "tecnico" ? especialidade : undefined,
      });
      setUsers((current) => [...current, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      setSuccess(`Conta de ${created.nome} criada — já pode logar com o usuário "${created.username}".`);
      setNome("");
      setUsername("");
      setSenha("");
      setRole("tecnico");
      setEspecialidade("Elétrica");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar usuário.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-industrial text-2xl font-bold text-white">Usuários</h1>
      <p className="mt-1 text-sm text-slate-400">
        Criação de conta restrita ao Administrador — não existe autocadastro no OpSync.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-3 rounded-xl border border-base-700 bg-base-850 p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Nome
            </span>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="Ex.: João Silva"
              className="w-full rounded-lg border border-base-600 bg-base-900 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-accent-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Usuário (login)
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="ex.: joao"
              className="w-full rounded-lg border border-base-600 bg-base-900 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-accent-500 focus:outline-none"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Senha
            </span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={4}
              placeholder="mín. 4 caracteres"
              className="w-full rounded-lg border border-base-600 bg-base-900 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-accent-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Papel
            </span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-lg border border-base-600 bg-base-900 px-3 py-2.5 text-white focus:border-accent-500 focus:outline-none"
            >
              <option value="tecnico">Técnico</option>
              <option value="administrador">Administrador</option>
            </select>
          </label>
        </div>

        {role === "tecnico" && (
          <label className="block sm:w-1/2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Especialidade
            </span>
            <select
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value as Especialidade)}
              className="w-full rounded-lg border border-base-600 bg-base-900 px-3 py-2.5 text-white focus:border-accent-500 focus:outline-none"
            >
              {ESPECIALIDADES.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </select>
          </label>
        )}

        {error && <p className="text-sm text-critical-500">{error}</p>}
        {success && <p className="text-sm text-ok-500">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-lg bg-accent-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-accent-500 disabled:opacity-50"
        >
          {submitting ? "Criando…" : "Criar conta"}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Contas cadastradas ({users.length})
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">Carregando…</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-base-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-base-800 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Nome</th>
                  <th className="px-4 py-2.5">Usuário</th>
                  <th className="px-4 py-2.5">Papel</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-base-700 bg-base-850">
                    <td className="px-4 py-2.5 text-slate-200">{u.nome}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">{u.username}</td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {ROLE_LABELS[u.role]}
                      {u.especialidade ? ` · ${u.especialidade}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
