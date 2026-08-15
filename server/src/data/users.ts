import type { AuthUser, PublicUser } from "../types.js";

// Contas de teste do MVP — senha em texto puro de propósito (demo/hackathon,
// estado em memória, sem banco). Uma conta por persona/técnico, os ids dos
// manutentores batem com os ids em technicians.ts.
export const USERS: AuthUser[] = [
  { id: "u-joao", nome: "João", username: "joao", senha: "1234", role: "funcionario" },
  { id: "u-marina", nome: "Marina", username: "marina", senha: "1234", role: "team-leader" },
  {
    id: "tec-carlos",
    nome: "Carlos",
    username: "carlos",
    senha: "1234",
    role: "manutencao",
    especialidade: "Elétrica",
  },
  {
    id: "tec-ana",
    nome: "Ana",
    username: "ana",
    senha: "1234",
    role: "manutencao",
    especialidade: "Mecânica",
  },
  {
    id: "tec-rafael",
    nome: "Rafael",
    username: "rafael",
    senha: "1234",
    role: "manutencao",
    especialidade: "Hidráulica",
  },
];

export function toPublicUser(user: AuthUser): PublicUser {
  const { senha: _senha, ...publicUser } = user;
  return publicUser;
}
