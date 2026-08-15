import crypto from "node:crypto";
import { pool, migrate } from "../db.js";
import type { AuthUser, Especialidade, Role } from "../types.js";

interface UserRow {
  id: string;
  nome: string;
  username: string;
  senha_hash: string;
  role: Role;
  especialidade: Especialidade | null;
}

function hashPassword(senha: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(senha: string, senhaHash: string): boolean {
  const [salt, hash] = senhaHash.split(":");
  if (!salt || !hash) return false;
  const stored = Buffer.from(hash, "hex");
  const candidate = crypto.scryptSync(senha, salt, 64);
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

function rowToUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    nome: row.nome,
    username: row.username,
    role: row.role,
    especialidade: row.especialidade ?? undefined,
  };
}

// Contas de demonstração do MVP — seedadas automaticamente na primeira query
// se a tabela `users` estiver vazia (banco novo do Neon). Servem pra validar
// o fluxo: loga como Marina (administrador) e cria as demais contas por ali.
const DEMO_USERS: {
  id: string;
  nome: string;
  username: string;
  senha: string;
  role: Role;
  especialidade?: Especialidade;
}[] = [
  { id: "u-marina", nome: "Marina", username: "marina", senha: "1234", role: "administrador" },
  {
    id: "tec-carlos",
    nome: "Carlos",
    username: "carlos",
    senha: "1234",
    role: "tecnico",
    especialidade: "Elétrica",
  },
  {
    id: "tec-ana",
    nome: "Ana",
    username: "ana",
    senha: "1234",
    role: "tecnico",
    especialidade: "Mecânica",
  },
  {
    id: "tec-rafael",
    nome: "Rafael",
    username: "rafael",
    senha: "1234",
    role: "tecnico",
    especialidade: "Hidráulica",
  },
];

let readyPromise: Promise<void> | null = null;

function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = migrate().then(async () => {
      const { rows } = await pool.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM users");
      if (rows[0].count > 0) return;
      for (const demo of DEMO_USERS) {
        await pool.query(
          `INSERT INTO users (id, nome, username, senha_hash, role, especialidade)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (username) DO NOTHING`,
          [demo.id, demo.nome, demo.username, hashPassword(demo.senha), demo.role, demo.especialidade ?? null],
        );
      }
    });
  }
  return readyPromise;
}

export async function findUserForLogin(
  username: string,
): Promise<{ user: AuthUser; senhaHash: string } | null> {
  await ensureReady();
  const { rows } = await pool.query<UserRow>("SELECT * FROM users WHERE username = $1", [username]);
  const row = rows[0];
  if (!row) return null;
  return { user: rowToUser(row), senhaHash: row.senha_hash };
}

export async function listUsers(): Promise<AuthUser[]> {
  await ensureReady();
  const { rows } = await pool.query<UserRow>("SELECT * FROM users ORDER BY nome");
  return rows.map(rowToUser);
}

export interface CreateUserInput {
  nome: string;
  username: string;
  senha: string;
  role: Role;
  especialidade?: Especialidade;
}

export type CreateUserResult = { ok: true; user: AuthUser } | { ok: false; reason: "username_taken" };

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  await ensureReady();
  const id = `${input.role === "administrador" ? "u" : "tec"}-${crypto.randomUUID()}`;
  try {
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (id, nome, username, senha_hash, role, especialidade)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, input.nome, input.username, hashPassword(input.senha), input.role, input.especialidade ?? null],
    );
    return { ok: true, user: rowToUser(rows[0]) };
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      return { ok: false, reason: "username_taken" };
    }
    throw err;
  }
}
