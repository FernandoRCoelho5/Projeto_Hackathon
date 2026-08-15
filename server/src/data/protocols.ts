import type { Especialidade } from "../types.js";

export interface CorrectionProtocol {
  titulo: string;
  passos: string[];
}

// Protocolo específico por código de falha (um por item de faultCodes.ts) —
// o que o técnico segue pra corrigir aquele problema específico.
const PROTOCOLS_BY_FAULT_CODE: Record<string, CorrectionProtocol> = {
  "E-402": {
    titulo: "Sobrecarga no Servo Motor",
    passos: [
      "Desenergizar o acionamento e sinalizar a máquina (LOTO) antes de qualquer intervenção.",
      "Verificar corrente do servo motor no drive e comparar com a placa (corrente nominal).",
      "Inspecionar o eixo acionado por travamento mecânico ou atrito anormal.",
      "Checar ventilação/dissipação de calor do drive e do motor.",
      "Resetar a falha no drive e religar em vazio antes de retomar a carga.",
    ],
  },
  "E-118": {
    titulo: "Falha no Sensor de Pressão",
    passos: [
      "Isolar o circuito hidráulico e aliviar a pressão residual antes de manusear o sensor.",
      "Verificar cabeamento e conector do sensor de pressão por oxidação ou rompimento.",
      "Comparar a leitura do sensor com um manômetro de referência.",
      "Substituir o sensor se a leitura divergir mais que 10% do manômetro de referência.",
      "Recalibrar e validar a leitura no painel antes de liberar a máquina.",
    ],
  },
  "E-231": {
    titulo: "Vibração Anormal no Rolamento",
    passos: [
      "Parar a máquina e aguardar resfriamento antes de tocar no rolamento.",
      "Checar folga axial/radial do rolamento e sinais de desgaste ou ruído.",
      "Verificar nível e estado da lubrificação do ponto.",
      "Substituir o rolamento se houver folga excessiva ou marcas de fadiga.",
      "Rodar em vazio e medir vibração novamente antes de liberar para produção.",
    ],
  },
  "E-305": {
    titulo: "Superaquecimento do Motor",
    passos: [
      "Desligar o motor e deixar resfriar antes de qualquer medição.",
      "Verificar obstrução na ventilação/aletas de resfriamento do motor.",
      "Medir corrente nas três fases e comparar com a placa do motor.",
      "Inspecionar isolamento e conexões do bobinado por sinais de sobreaquecimento.",
      "Religar em vazio, monitorar temperatura por 10 min antes de colocar em carga.",
    ],
  },
  "P-118": {
    titulo: "Tendência de Vibração Crescente",
    passos: [
      "Registrar a tendência de vibração das últimas horas na telemetria.",
      "Inspecionar fixação e alinhamento dos componentes móveis.",
      "Verificar a lubrificação preventiva do ponto identificado.",
      "Agendar troca de rolamento na próxima janela de parada programada, se a tendência persistir.",
    ],
  },
  "P-204": {
    titulo: "Tendência de Temperatura Crescente",
    passos: [
      "Registrar a curva de temperatura das últimas horas na telemetria.",
      "Verificar ventilação e limpeza das aletas/dissipadores.",
      "Medir corrente de operação e comparar com a nominal.",
      "Agendar inspeção elétrica completa se a tendência não estabilizar.",
    ],
  },
  "P-330": {
    titulo: "Padrão de Pressão Irregular",
    passos: [
      "Registrar a oscilação de pressão das últimas horas na telemetria.",
      "Verificar vazamentos e conexões do circuito hidráulico.",
      "Checar o estado do filtro e o nível do reservatório de óleo.",
      "Agendar manutenção preventiva do sistema hidráulico se a oscilação continuar.",
    ],
  },
};

// Fallback genérico por especialidade, pra chamados sem código de falha
// específico (ou fora da tabela).
const GENERIC_PROTOCOLS: Record<Especialidade, CorrectionProtocol> = {
  Elétrica: {
    titulo: "Protocolo geral — Elétrica",
    passos: [
      "Desenergizar e sinalizar (LOTO) antes de qualquer intervenção no painel.",
      "Verificar disjuntores, fusíveis e contatores do circuito afetado.",
      "Medir tensão de alimentação do motor/comando.",
      "Inspecionar cabos e conexões por sinais de sobreaquecimento ou oxidação.",
      "Testar em vazio antes de liberar a máquina para produção.",
    ],
  },
  Mecânica: {
    titulo: "Protocolo geral — Mecânica",
    passos: [
      "Bloquear e sinalizar a máquina antes de intervir em partes móveis.",
      "Verificar alinhamento e fixação dos componentes.",
      "Checar nível de lubrificação e desgaste de rolamentos/correias.",
      "Inspecionar ruído e vibração com a máquina em vazio.",
      "Registrar as peças trocadas e liberar para produção.",
    ],
  },
  Hidráulica: {
    titulo: "Protocolo geral — Hidráulica",
    passos: [
      "Aliviar a pressão do circuito antes de qualquer intervenção.",
      "Checar nível e vazamentos no reservatório de óleo.",
      "Verificar a pressão do sistema no manômetro.",
      "Inspecionar mangueiras, conexões e vedações por desgaste.",
      "Testar o ciclo completo antes de liberar a máquina.",
    ],
  },
};

export function getProtocol(codigoFalha?: string, especialidade?: Especialidade): CorrectionProtocol {
  if (codigoFalha && PROTOCOLS_BY_FAULT_CODE[codigoFalha]) {
    return PROTOCOLS_BY_FAULT_CODE[codigoFalha];
  }
  if (especialidade && GENERIC_PROTOCOLS[especialidade]) {
    return GENERIC_PROTOCOLS[especialidade];
  }
  return GENERIC_PROTOCOLS.Mecânica;
}
