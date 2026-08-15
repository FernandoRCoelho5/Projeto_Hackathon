import { Router } from "express";
import { login, logout, requireAuth } from "../auth.js";

export const authRouter = Router();

authRouter.post("/auth/login", async (req, res) => {
  const { username, senha } = req.body ?? {};
  if (typeof username !== "string" || typeof senha !== "string") {
    res.status(400).json({ error: "Usuário e senha são obrigatórios." });
    return;
  }

  try {
    const result = await login(username, senha);
    if (!result) {
      res.status(401).json({ error: "Usuário ou senha inválidos." });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error("[opsync] erro no login:", err);
    res.status(500).json({ error: "Erro ao conectar no banco de dados." });
  }
});

authRouter.post("/auth/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization!.slice("Bearer ".length);
  logout(token);
  res.json({ ok: true });
});

authRouter.get("/auth/me", requireAuth, (req, res) => {
  res.json(req.user!);
});
