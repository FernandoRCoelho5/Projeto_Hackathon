import { Router } from "express";
import { MACHINE_NAMES } from "../data/machines.js";
import { requireRole } from "../auth.js";
import { createMaintenanceEvent, listMaintenanceEvents } from "../store.js";
import type { TipoEventoManutencao } from "../types.js";

const TIPOS: TipoEventoManutencao[] = ["reparo", "troca_peca", "preventiva", "outro"];

export const maintenanceEventsRouter = Router();

maintenanceEventsRouter.get("/machines/:maquina/eventos", (req, res) => {
  const maquina = decodeURIComponent(req.params.maquina);
  res.json(listMaintenanceEvents(maquina));
});

maintenanceEventsRouter.post(
  "/machines/:maquina/eventos",
  requireRole("team-leader"),
  (req, res) => {
    const maquina = decodeURIComponent(req.params.maquina);
    if (!MACHINE_NAMES.includes(maquina)) {
      res.status(400).json({ error: "Máquina/linha inválida." });
      return;
    }

    const { tipo, descricao, pecasTrocadas, ticketId } = req.body ?? {};

    if (typeof tipo !== "string" || !TIPOS.includes(tipo as TipoEventoManutencao)) {
      res.status(400).json({ error: "Tipo de evento inválido." });
      return;
    }
    if (typeof descricao !== "string" || descricao.trim().length === 0) {
      res.status(400).json({ error: "Descrição do evento é obrigatória." });
      return;
    }
    if (
      pecasTrocadas !== undefined &&
      (!Array.isArray(pecasTrocadas) || !pecasTrocadas.every((p) => typeof p === "string"))
    ) {
      res.status(400).json({ error: "Peças trocadas deve ser uma lista de textos." });
      return;
    }

    const event = createMaintenanceEvent(
      {
        maquina,
        tipo: tipo as TipoEventoManutencao,
        descricao: descricao.trim(),
        pecasTrocadas,
        ticketId: typeof ticketId === "string" ? ticketId : undefined,
      },
      req.user!,
    );

    res.status(201).json(event);
  },
);
