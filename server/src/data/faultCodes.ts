import type { FaultCode } from "../types.js";

// Simula a leitura de um código de falha de CLP — fixo no código, sem IA.
// Dois grupos: "reativo" (parada real) e "preventivo" (máquina rodando,
// telemetria com tendência de piora).

export const REACTIVE_FAULT_CODES: FaultCode[] = [
  {
    codigo: "E-402",
    descricao: "Sobrecarga no Servo Motor",
    especialidade: "Elétrica",
    prioridade: "Vermelho",
    telemetria: ["Vibração: 34% acima do padrão", "Temperatura: 78°C"],
    tipo: "reativo",
  },
  {
    codigo: "E-118",
    descricao: "Falha no Sensor de Pressão",
    especialidade: "Hidráulica",
    prioridade: "Amarelo",
    telemetria: ["Pressão: 22% abaixo do padrão"],
    tipo: "reativo",
  },
  {
    codigo: "E-231",
    descricao: "Vibração Anormal no Rolamento",
    especialidade: "Mecânica",
    prioridade: "Amarelo",
    telemetria: ["Vibração: 41% acima do padrão"],
    tipo: "reativo",
  },
  {
    codigo: "E-305",
    descricao: "Superaquecimento do Motor",
    especialidade: "Elétrica",
    prioridade: "Vermelho",
    telemetria: ["Temperatura: 91°C"],
    tipo: "reativo",
  },
];

export const PREVENTIVE_FAULT_CODES: FaultCode[] = [
  {
    codigo: "P-118",
    descricao: "Tendência de Vibração Crescente",
    especialidade: "Mecânica",
    prioridade: "Verde",
    telemetria: ["Vibração subindo, 15% acima do padrão nas últimas 2h"],
    tipo: "preventivo",
  },
  {
    codigo: "P-204",
    descricao: "Tendência de Temperatura Crescente",
    especialidade: "Elétrica",
    prioridade: "Verde",
    telemetria: ["Temperatura subindo, 9% acima do padrão nas últimas 3h"],
    tipo: "preventivo",
  },
  {
    codigo: "P-330",
    descricao: "Padrão de Pressão Irregular",
    especialidade: "Hidráulica",
    prioridade: "Verde",
    telemetria: ["Pressão oscilando 12% fora da faixa nas últimas 4h"],
    tipo: "preventivo",
  },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function drawFaultCode(): FaultCode {
  const tipo: "reativo" | "preventivo" = Math.random() < 0.5 ? "reativo" : "preventivo";
  const pool = tipo === "reativo" ? REACTIVE_FAULT_CODES : PREVENTIVE_FAULT_CODES;
  return pickRandom(pool);
}
