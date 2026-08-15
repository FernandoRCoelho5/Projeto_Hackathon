import { useCallback, useState } from "react";
import { api } from "./api";
import { clearSession, getStoredUser, getToken, setSession } from "./session";
import type { AuthUser, Role } from "./types";

export const ROLE_LABELS: Record<Role, string> = {
  administrador: "Administrador",
  tecnico: "Técnico",
};

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const login = useCallback(async (username: string, senha: string) => {
    const result = await api.login(username, senha);
    setSession(result.token, result.user);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    api.logout().catch(() => {
      // silencioso — encerra a sessão local de qualquer forma
    });
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  return { token, user, login, logout };
}
