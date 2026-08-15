import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { AuthUser, Role } from "./types.js";
import { findUserForLogin, verifyPassword } from "./data/users.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.NEXTAUTH_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "NEXTAUTH_SECRET não configurada. Copie server/.env.example pra server/.env e gere um valor com: openssl rand -base64 32",
  );
}

const TOKEN_TTL_SECONDS = 60 * 60 * 12; // 12h

function sign(headerAndPayload: string): string {
  return crypto.createHmac("sha256", JWT_SECRET as string).update(headerAndPayload).digest("base64url");
}

// Token assinado (HMAC-SHA256) com NEXTAUTH_SECRET — stateless, ao contrário
// do token opaco em Map de antes: sobrevive a múltiplas instâncias
// serverless e cold starts, sem precisar de storage de sessão.
function signToken(user: AuthUser): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ ...user, iat: now, exp: now + TOKEN_TTL_SECONDS })).toString(
    "base64url",
  );
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

function verifyToken(token: string): AuthUser | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  const expected = sign(`${header}.${payload}`);
  const provided = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (provided.length !== expectedBuf.length || !crypto.timingSafeEqual(provided, expectedBuf)) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof claims.exp === "number" && claims.exp < Math.floor(Date.now() / 1000)) return null;
    const { iat: _iat, exp: _exp, ...user } = claims;
    return user as AuthUser;
  } catch {
    return null;
  }
}

export async function login(
  username: string,
  senha: string,
): Promise<{ token: string; user: AuthUser } | null> {
  const found = await findUserForLogin(username);
  if (!found || !verifyPassword(senha, found.senhaHash)) return null;
  return { token: signToken(found.user), user: found.user };
}

// Sessão é stateless (JWT assinado) — não há nada pra apagar no servidor no
// logout; o client já limpa o token do localStorage.
export function logout(_token: string): void {}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  const user = token ? verifyToken(token) : null;
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
