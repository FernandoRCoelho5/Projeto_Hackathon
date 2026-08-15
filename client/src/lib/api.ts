import { useCallback, useEffect, useState } from "react";
import { clearSession, getToken } from "./session";
import type { AuthUser, Dossie, MaintenanceEvent, Machine, Ticket, TipoEventoManutencao } from "./types";

// Em dev, o proxy do Vite encaminha /api pro server local (vite.config.ts).
// Em produção, se client e server forem projetos Vercel separados (domínios
// diferentes), defina VITE_API_URL com a URL pública da API.
export const BASE = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  if (res.status === 401) {
    clearSession();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (username: string, senha: string) =>
    request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, senha }),
    }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  getMachines: () => request<Machine[]>("/machines"),
  getTickets: () => request<Ticket[]>("/tickets"),
  simulateTicket: () => request<Ticket>("/tickets/simulate", { method: "POST" }),
  claimTicket: (id: string) => request<Ticket>(`/tickets/${id}/claim`, { method: "POST" }),
  closeTicket: (id: string) => request<Ticket>(`/tickets/${id}/close`, { method: "POST" }),
  getDossie: (maquina: string) => request<Dossie>(`/dossie/${encodeURIComponent(maquina)}`),
  getRealDemoMttr: () => request<{ averageMs: number | null; count: number }>("/mttr-real"),
  getSimulationStatus: () => request<{ autoMode: boolean }>("/simulation/status"),
  toggleSimulation: (enabled: boolean) =>
    request<{ autoMode: boolean }>("/simulation/toggle", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }),
  getMaintenanceEvents: (maquina: string) =>
    request<MaintenanceEvent[]>(`/machines/${encodeURIComponent(maquina)}/eventos`),
  createMaintenanceEvent: (
    maquina: string,
    input: { tipo: TipoEventoManutencao; descricao: string; pecasTrocadas?: string[] },
  ) =>
    request<MaintenanceEvent>(`/machines/${encodeURIComponent(maquina)}/eventos`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

export function useTickets(pollMs = 2000) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getTickets();
      setTickets(data);
    } catch {
      // silencioso — próximo poll tenta de novo
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { tickets, loading, refresh };
}

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    api.getMachines().then(setMachines).catch(() => {
      // silencioso — specs de máquina são só um complemento visual
    });
  }, []);

  return machines;
}

export function useSimulationStatus(pollMs = 3000) {
  const [autoMode, setAutoMode] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getSimulationStatus();
      setAutoMode(data.autoMode);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { autoMode, setAutoMode, refresh };
}
