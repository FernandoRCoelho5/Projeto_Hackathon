import { Router } from "express";
import { MACHINE_NAMES } from "../data/machines.js";
import { classifyWithAI } from "../ai.js";
import { requireRole } from "../auth.js";
import {
  claimTicket,
  closeTicket,
  createTicket,
  getDossie,
  getRealDemoMttr,
  listTickets,
} from "../store.js";
import { generateSimulatedTicket } from "../simulation.js";

export const ticketsRouter = Router();

ticketsRouter.get("/tickets", (_req, res) => {
  res.json(listTickets());
});

ticketsRouter.post("/tickets", requireRole("funcionario", "team-leader"), async (req, res) => {
  const { maquina, descricao } = req.body ?? {};

  if (typeof maquina !== "string" || !MACHINE_NAMES.includes(maquina)) {
    res.status(400).json({ error: "Máquina/linha inválida." });
    return;
  }
  if (typeof descricao !== "string" || descricao.trim().length === 0) {
    res.status(400).json({ error: "Descrição do problema é obrigatória." });
    return;
  }

  const classification = await classifyWithAI(descricao.trim());

  const ticket = createTicket({
    maquina,
    descricao: descricao.trim(),
    prioridade: classification.prioridade,
    especialidade: classification.especialidade,
    checklist: classification.checklist,
    telemetria: [],
    origem: "manual",
  });

  res.status(201).json(ticket);
});

ticketsRouter.post(
  "/tickets/simulate",
  requireRole("team-leader"),
  (_req, res) => {
    const ticket = generateSimulatedTicket();
    res.status(201).json(ticket);
  },
);

ticketsRouter.post("/tickets/:id/claim", requireRole("manutencao"), (req, res) => {
  const result = claimTicket(req.params.id, req.user!);
  if (!result.ok) {
    if (result.reason === "not_found") {
      res.status(404).json({ error: "Chamado não encontrado." });
      return;
    }
    res.status(409).json({ error: "Esse chamado já foi assumido por outra pessoa." });
    return;
  }
  res.json(result.ticket);
});

ticketsRouter.post(
  "/tickets/:id/close",
  requireRole("manutencao", "team-leader"),
  (req, res) => {
    const result = closeTicket(req.params.id, req.user!);
    if (!result.ok) {
      if (result.reason === "not_found") {
        res.status(404).json({ error: "Chamado não encontrado." });
        return;
      }
      if (result.reason === "already_closed") {
        res.status(409).json({ error: "Chamado já está encerrado." });
        return;
      }
      res.status(403).json({ error: "Só quem assumiu o chamado pode encerrá-lo." });
      return;
    }
    res.json(result.ticket);
  },
);

ticketsRouter.get("/dossie/:maquina", (req, res) => {
  const maquina = decodeURIComponent(req.params.maquina);
  res.json(getDossie(maquina));
});

ticketsRouter.get("/mttr-real", requireRole("team-leader"), (_req, res) => {
  res.json(getRealDemoMttr());
});
