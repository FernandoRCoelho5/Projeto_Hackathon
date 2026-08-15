export type Prioridade = "Vermelho" | "Amarelo" | "Verde";
export type Especialidade = "Elétrica" | "Mecânica" | "Hidráulica";
export type Origem = "manual" | "simulado";
export type TipoSimulacao = "reativo" | "preventivo";
export type Role = "funcionario" | "team-leader" | "manutencao";
export type Criticidade = "alta" | "media" | "baixa";
export type TipoEventoManutencao = "reparo" | "troca_peca" | "preventiva" | "outro";

export interface Technician {
  id: string;
  nome: string;
  especialidade: Especialidade;
}

export interface AuthUser {
  id: string;
  nome: string;
  username: string;
  senha: string;
  role: Role;
  especialidade?: Especialidade;
}

export type PublicUser = Omit<AuthUser, "senha">;

export interface Machine {
  id: string;
  nome: string;
  setor: string;
  modelo: string;
  fabricante: string;
  instaladaEm: string; // ISO date
  criticidade: Criticidade;
}

export interface FaultCode {
  codigo: string;
  descricao: string;
  especialidade: Especialidade;
  prioridade: Prioridade;
  telemetria: string[];
  tipo: TipoSimulacao;
}

export interface AssumidoPor {
  id: string;
  nome: string;
}

export interface Ticket {
  id: string;
  maquina: string;
  descricao: string;
  prioridade: Prioridade;
  especialidade: Especialidade;
  checklist: string[];
  telemetria: string[];
  tecnico: Technician;
  origem: Origem;
  tipoSimulacao?: TipoSimulacao;
  codigoFalha?: string;
  abertoEm: string; // ISO timestamp
  fechadoEm: string | null;
  mttrMs: number | null;
  status: "aberto" | "em_andamento" | "fechado";
  assumidoPor: AssumidoPor | null;
  assumidoEm: string | null;
  /** Chamado fictício de seed (histórico pré-carregado) — não conta como MTTR "real da demo". */
  isSeed?: boolean;
}

export interface MaintenanceEvent {
  id: string;
  maquina: string;
  tipo: TipoEventoManutencao;
  descricao: string;
  pecasTrocadas?: string[];
  registradoPor: AssumidoPor;
  criadoEm: string;
  ticketId?: string;
}

export interface DossieChamado {
  id: string;
  codigoFalha?: string;
  descricao: string;
  abertoEm: string;
  fechadoEm: string;
  mttrMs: number;
}

export interface Dossie {
  maquina: string;
  chamados: DossieChamado[];
  mttrMedioMs: number | null;
  mtbfMs: number | null;
}
