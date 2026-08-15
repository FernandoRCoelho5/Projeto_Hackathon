import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { AuthUser, Role } from "./types.js";
import { USERS } from "./data/users.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const sessions = new Map<string, AuthUser>();

export function login(username: string, senha: string): { token: string; user: AuthUser } | null {
  const user = USERS.find((u) => u.username === username && u.senha === senha);
  if (!user) return null;
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, user);
  return { token, user };
}

export function logout(token: string): void {
  sessions.delete(token);
}

export function getUserByToken(token: string): AuthUser | null {
  return sessions.get(token) ?? null;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  const user = token ? getUserByToken(token) : null;
  if (!user) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }
  req.user = user;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Sem permissão para esta ação." });
      return;
    }
    next();
  };
}
