import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL não configurada. Copie server/.env.example pra server/.env e cole a connection string do Neon (Dashboard > Connect).",
  );
}

export const pool = new Pool({ connectionString });

let migratePromise: Promise<void> | null = null;

/** Cria as tabelas se ainda não existirem. Memoizado — roda uma vez por processo. */
export function migrate(): Promise<void> {
  if (!migratePromise) {
    migratePromise = pool
      .query(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          username TEXT UNIQUE NOT NULL,
          senha_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('administrador', 'tecnico')),
          especialidade TEXT,
          criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
        )`,
      )
      .then(() => undefined);
  }
  return migratePromise;
}
