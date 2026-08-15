import { Router } from "express";
import { login, logout, requireAuth } from "../auth.js";
import { toPublicUser } from "../data/users.js";

export const authRouter = Router();

authRouter.post("/auth/login", (req, res) => {
  const { username, senha } = req.body ?? {};
  if (typeof username !== "string" || typeof senha !== "string") {
    res.status(400).json({ error: "Usuário e senha são obrigatórios." });
    return;
  }

  const result = login(username, senha);
  if (!result) {
    res.status(401).json({ error: "Usuário ou senha inválidos." });
    return;
  }

  res.json({ token: result.token, user: toPublicUser(result.user) });
});

authRouter.post("/auth/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization!.slice("Bearer ".length);
  logout(token);
  res.json({ ok: true });
});

authRouter.get("/auth/me", requireAuth, (req, res) => {
  res.json(toPublicUser(req.user!));
});
