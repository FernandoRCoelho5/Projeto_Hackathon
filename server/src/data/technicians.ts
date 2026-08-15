import type { Technician } from "../types.js";

export const TECHNICIANS: Technician[] = [
  { id: "tec-carlos", nome: "Carlos", especialidade: "Elétrica" },
  { id: "tec-ana", nome: "Ana", especialidade: "Mecânica" },
  { id: "tec-rafael", nome: "Rafael", especialidade: "Hidráulica" },
];

export function assignTechnician(especialidade: Technician["especialidade"]): Technician {
  const tech = TECHNICIANS.find((t) => t.especialidade === especialidade);
  // Sempre existe um técnico por especialidade na lista fixa acima.
  return tech ?? TECHNICIANS[0];
}
