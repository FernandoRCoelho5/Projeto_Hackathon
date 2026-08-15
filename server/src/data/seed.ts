import type { Ticket } from "../types.js";
import { assignTechnician } from "./technicians.js";

// Chamados fictícios já fechados, pra o dossiê e a calculadora de impacto
// não começarem vazios na demo.

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.now();

function seedTicket(params: {
  id: string;
  maquina: string;
  descricao: string;
  especialidade: Ticket["especialidade"];
  prioridade: Ticket["prioridade"];
  daysAgo: number;
  mttrMinutes: number;
}): Ticket {
  const abertoEm = now - params.daysAgo * DAY_MS;
  const fechadoEm = abertoEm + params.mttrMinutes * 60 * 1000;
  return {
    id: params.id,
    maquina: params.maquina,
    descricao: params.descricao,
    prioridade: params.prioridade,
    especialidade: params.especialidade,
    checklist: [],
    telemetria: [],
    tecnico: assignTechnician(params.especialidade),
    origem: "manual",
    abertoEm: new Date(abertoEm).toISOString(),
    fechadoEm: new Date(fechadoEm).toISOString(),
    mttrMs: params.mttrMinutes * 60 * 1000,
    status: "fechado",
    assumidoPor: null,
    assumidoEm: null,
    isSeed: true,
  };
}

export function buildSeedTickets(): Ticket[] {
  return [
    seedTicket({
      id: "seed-1",
      maquina: "Linha 1 - Solda",
      descricao: "Robô de solda parou com falha de posicionamento no braço 2.",
      especialidade: "Mecânica",
      prioridade: "Vermelho",
      daysAgo: 32,
      mttrMinutes: 95,
    }),
    seedTicket({
      id: "seed-2",
      maquina: "Linha 1 - Solda",
      descricao: "Painel elétrico da solda desarmando sozinho a cada 20 minutos.",
      especialidade: "Elétrica",
      prioridade: "Amarelo",
      daysAgo: 21,
      mttrMinutes: 40,
    }),
    seedTicket({
      id: "seed-3",
      maquina: "Linha 1 - Solda",
      descricao: "Vazamento de óleo no sistema hidráulico do gabarito de solda.",
      especialidade: "Hidráulica",
      prioridade: "Amarelo",
      daysAgo: 11,
      mttrMinutes: 62,
    }),
    seedTicket({
      id: "seed-4",
      maquina: "Linha 1 - Solda",
      descricao: "Barulho estranho no motor do eixo X, intermitente.",
      especialidade: "Mecânica",
      prioridade: "Amarelo",
      daysAgo: 3,
      mttrMinutes: 28,
    }),
    seedTicket({
      id: "seed-5",
      maquina: "Linha 2 - Pintura",
      descricao: "Bico de pintura entupido, jato irregular na cabine 3.",
      especialidade: "Mecânica",
      prioridade: "Amarelo",
      daysAgo: 25,
      mttrMinutes: 35,
    }),
    seedTicket({
      id: "seed-6",
      maquina: "Linha 2 - Pintura",
      descricao: "Queda de pressão no compressor que alimenta a cabine.",
      especialidade: "Hidráulica",
      prioridade: "Vermelho",
      daysAgo: 14,
      mttrMinutes: 110,
    }),
    seedTicket({
      id: "seed-7",
      maquina: "Linha 2 - Pintura",
      descricao: "Curto no comando elétrico do transportador de entrada.",
      especialidade: "Elétrica",
      prioridade: "Vermelho",
      daysAgo: 5,
      mttrMinutes: 73,
    }),
  ];
}
