import { Router } from "express";
import { requireRole } from "../auth.js";
import { createUser, listUsers } from "../data/users.js";
import type { Especialidade, Role } from "../types.js";

export const usersRouter = Router();

const ROLES: Role[] = ["administrador", "tecnico"];
const ESPECIALIDADES: Especialidade[] = ["Elétrica", "Mecânica", "Hidráulica"];

// Criação de conta é restrita ao Administrador — não existe autocadastro.
usersRouter.get("/users", requireRole("administrador"), async (_req, res) => {
  try {
    res.json(await listUsers());
  } catch (err) {
    console.error("[opsync] erro ao listar usuários:", err);
    res.status(500).json({ error: "Erro ao carregar usuários." });
  }
});

usersRouter.post("/users", requireRole("administrador"), async (req, res) => {
  const { nome, username, senha, role, especialidade } = req.body ?? {};

  if (typeof nome !== "string" || nome.trim().length === 0) {
    res.status(400).json({ error: "Nome é obrigatório." });
    return;
  }
  if (typeof username !== "string" || !/^[a-z0-9._-]{3,32}$/i.test(username)) {
    res.status(400).json({ error: "Usuário deve ter de 3 a 32 caracteres (letras, números, ., _, -)." });
    return;
  }
  if (typeof senha !== "string" || senha.length < 4) {
    res.status(400).json({ error: "Senha deve ter pelo menos 4 caracteres." });
    return;
  }
  if (typeof role !== "string" || !ROLES.includes(role as Role)) {
    res.status(400).json({ error: "Papel inválido." });
    return;
  }
  if (role === "tecnico" && !ESPECIALIDADES.includes(especialidade as Especialidade)) {
    res.status(400).json({ error: "Especialidade é obrigatória para técnico." });
    return;
  }

  try {
    const result = await createUser({
      nome: nome.trim(),
      username: username.trim().toLowerCase(),
      senha,
      role: role as Role,
      especialidade: role === "tecnico" ? (especialidade as Especialidade) : undefined,
    });
    if (!result.ok) {
      res.status(409).json({ error: "Já existe uma conta com esse usuário." });
      return;
    }
    res.status(201).json(result.user);
  } catch (err) {
    console.error("[opsync] erro ao criar usuário:", err);
    res.status(500).json({ error: "Erro ao criar usuário." });
  }
});
