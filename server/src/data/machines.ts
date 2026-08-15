import type { Machine } from "../types.js";

export const MACHINES: Machine[] = [
  {
    id: "linha-1-solda",
    nome: "Linha 1 - Solda",
    setor: "Carroceria",
    modelo: "RoboWeld X200",
    fabricante: "KUKA",
    instaladaEm: "2019-03-10",
    criticidade: "alta",
  },
  {
    id: "linha-2-pintura",
    nome: "Linha 2 - Pintura",
    setor: "Pintura",
    modelo: "PaintCell V4",
    fabricante: "Dürr",
    instaladaEm: "2020-07-22",
    criticidade: "alta",
  },
  {
    id: "linha-3-montagem",
    nome: "Linha 3 - Montagem",
    setor: "Montagem Final",
    modelo: "AssemblyLine M9",
    fabricante: "Bosch",
    instaladaEm: "2018-11-05",
    criticidade: "media",
  },
];

export const MACHINE_NAMES = MACHINES.map((m) => m.nome);

export function getMachineByName(nome: string): Machine | undefined {
  return MACHINES.find((m) => m.nome === nome);
}
