import { MACHINE_NAMES } from "./data/machines.js";
import { drawFaultCode } from "./data/faultCodes.js";
import { createTicket } from "./store.js";
import type { Ticket } from "./types.js";

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateSimulatedTicket(): Ticket {
  const maquina = pickRandom(MACHINE_NAMES);
  const fault = drawFaultCode();

  return createTicket({
    maquina,
    descricao: `${fault.codigo} - ${fault.descricao}`,
    prioridade: fault.prioridade,
    especialidade: fault.especialidade,
    checklist: [],
    telemetria: fault.telemetria,
    origem: "simulado",
    tipoSimulacao: fault.tipo,
    codigoFalha: fault.codigo,
  });
}

const MIN_INTERVAL_MS = 12_000;
const MAX_INTERVAL_MS = 18_000;

let autoModeEnabled = false;
let timer: NodeJS.Timeout | null = null;

function scheduleNext() {
  const delay = MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
  timer = setTimeout(() => {
    if (!autoModeEnabled) return;
    generateSimulatedTicket();
    scheduleNext();
  }, delay);
}

export function isAutoModeEnabled(): boolean {
  return autoModeEnabled;
}

export function setAutoMode(enabled: boolean): void {
  if (enabled === autoModeEnabled) return;
  autoModeEnabled = enabled;
  if (enabled) {
    scheduleNext();
  } else if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
