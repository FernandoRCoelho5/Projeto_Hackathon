import type {
  AuthUser,
  Dossie,
  Especialidade,
  MaintenanceEvent,
  Prioridade,
  TipoEventoManutencao,
  Ticket,
} from "./types.js";
import { assignTechnician } from "./data/technicians.js";
import { buildSeedTickets } from "./data/seed.js";

const tickets: Ticket[] = buildSeedTickets();
const maintenanceEvents: MaintenanceEvent[] = [];

let nextId = 1;
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${nextId++}`;
}

export function listTickets(): Ticket[] {
  return [...tickets].sort((a, b) => (a.abertoEm < b.abertoEm ? 1 : -1));
}

export function listOpenTickets(): Ticket[] {
  return listTickets().filter((t) => t.status === "aberto");
}

export interface CreateTicketInput {
  maquina: string;
  descricao: string;
  prioridade: Prioridade;
  especialidade: Especialidade;
  checklist: string[];
  telemetria: string[];
  origem: Ticket["origem"];
  tipoSimulacao?: Ticket["tipoSimulacao"];
  codigoFalha?: string;
}

export function createTicket(input: CreateTicketInput): Ticket {
  const ticket: Ticket = {
    id: generateId("t"),
    maquina: input.maquina,
    descricao: input.descricao,
    prioridade: input.prioridade,
    especialidade: input.especialidade,
    checklist: input.checklist,
    telemetria: input.telemetria,
    tecnico: assignTechnician(input.especialidade),
    origem: input.origem,
    tipoSimulacao: input.tipoSimulacao,
    codigoFalha: input.codigoFalha,
    abertoEm: new Date().toISOString(),
    fechadoEm: null,
    mttrMs: null,
    status: "aberto",
    assumidoPor: null,
    assumidoEm: null,
  };
  tickets.push(ticket);
  return ticket;
}

export type ClaimResult =
  | { ok: true; ticket: Ticket }
  | { ok: false; reason: "not_found" | "already_claimed" };

export function claimTicket(id: string, user: AuthUser): ClaimResult {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return { ok: false, reason: "not_found" };
  if (ticket.status !== "aberto") return { ok: false, reason: "already_claimed" };

  ticket.status = "em_andamento";
  ticket.assumidoPor = { id: user.id, nome: user.nome };
  ticket.assumidoEm = new Date().toISOString();
  return { ok: true, ticket };
}

export type CloseResult =
  | { ok: true; ticket: Ticket }
  | { ok: false; reason: "not_found" | "already_closed" | "not_owner" };

export function closeTicket(id: string, user: AuthUser): CloseResult {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return { ok: false, reason: "not_found" };
  if (ticket.status === "fechado") return { ok: false, reason: "already_closed" };

  const isOwner = ticket.assumidoPor?.id === user.id;
  if (user.role === "tecnico" && !isOwner) {
    return { ok: false, reason: "not_owner" };
  }

  const fechadoEm = new Date();
  ticket.fechadoEm = fechadoEm.toISOString();
  ticket.mttrMs = fechadoEm.getTime() - new Date(ticket.abertoEm).getTime();
  ticket.status = "fechado";
  if (!ticket.assumidoPor) {
    ticket.assumidoPor = { id: user.id, nome: user.nome };
    ticket.assumidoEm = ticket.assumidoEm ?? fechadoEm.toISOString();
  }
  return { ok: true, ticket };
}

export function getDossie(maquina: string): Dossie {
  const fechados = tickets
    .filter((t) => t.maquina === maquina && t.status === "fechado" && t.mttrMs !== null)
    .sort((a, b) => (a.abertoEm < b.abertoEm ? -1 : 1));

  const mttrMedioMs =
    fechados.length > 0
      ? fechados.reduce((sum, t) => sum + (t.mttrMs ?? 0), 0) / fechados.length
      : null;

  let mtbfMs: number | null = null;
  if (fechados.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < fechados.length; i++) {
      const prev = new Date(fechados[i - 1].abertoEm).getTime();
      const curr = new Date(fechados[i].abertoEm).getTime();
      gaps.push(curr - prev);
    }
    mtbfMs = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  }

  return {
    maquina,
    chamados: fechados.map((t) => ({
      id: t.id,
      codigoFalha: t.codigoFalha,
      descricao: t.descricao,
      abertoEm: t.abertoEm,
      fechadoEm: t.fechadoEm as string,
      mttrMs: t.mttrMs as number,
    })),
    mttrMedioMs,
    mtbfMs,
  };
}

/**
 * MTTR médio apenas dos chamados fechados AO VIVO durante esta sessão (exclui
 * o histórico de seed) — é o número que prova o ganho de velocidade do OpSync
 * na calculadora de impacto, em vez de diluir com dados pré-carregados.
 */
export function getRealDemoMttr(): { averageMs: number | null; count: number } {
  const fechados = tickets.filter(
    (t) => t.status === "fechado" && t.mttrMs !== null && !t.isSeed,
  );
  if (fechados.length === 0) return { averageMs: null, count: 0 };
  const averageMs = fechados.reduce((sum, t) => sum + (t.mttrMs ?? 0), 0) / fechados.length;
  return { averageMs, count: fechados.length };
}

export function listMaintenanceEvents(maquina: string): MaintenanceEvent[] {
  return maintenanceEvents
    .filter((e) => e.maquina === maquina)
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
}

export function getMaintenanceEventById(id: string): MaintenanceEvent | undefined {
  return maintenanceEvents.find((e) => e.id === id);
}

export function getTicketById(id: string): Ticket | undefined {
  return tickets.find((t) => t.id === id);
}

export interface CreateMaintenanceEventInput {
  maquina: string;
  tipo: TipoEventoManutencao;
  descricao: string;
  pecasTrocadas?: string[];
  ticketId?: string;
}

export function createMaintenanceEvent(
  input: CreateMaintenanceEventInput,
  user: AuthUser,
): MaintenanceEvent {
  const event: MaintenanceEvent = {
    id: generateId("ev"),
    maquina: input.maquina,
    tipo: input.tipo,
    descricao: input.descricao,
    pecasTrocadas: input.pecasTrocadas,
    registradoPor: { id: user.id, nome: user.nome },
    criadoEm: new Date().toISOString(),
    ticketId: input.ticketId,
  };
  maintenanceEvents.push(event);
  return event;
}
