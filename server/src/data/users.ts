import type { AuthUser, PublicUser } from "../types.js";

// Contas de teste do MVP — senha em texto puro de propósito (demo/hackathon,
// estado em memória, sem banco). Só duas hierarquias: administrador e
// técnico. Os ids dos técnicos batem com os ids em technicians.ts.
export const USERS: AuthUser[] = [
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

export function toPublicUser(user: AuthUser): PublicUser {
  const { senha: _senha, ...publicUser } = user;
  return publicUser;
}
