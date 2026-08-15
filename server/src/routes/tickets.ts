import { Router } from "express";
import { requireRole } from "../auth.js";
import {
  claimTicket,
  closeTicket,
  getDossie,
  getRealDemoMttr,
  listTickets,
} from "../store.js";
import { generateSimulatedTicket } from "../simulation.js";

export const ticketsRouter = Router();

ticketsRouter.get("/tickets", (_req, res) => {
  res.json(listTickets());
});

ticketsRouter.post(
  "/tickets/simulate",
  requireRole("administrador"),
  (_req, res) => {
    const ticket = generateSimulatedTicket();
    res.status(201).json(ticket);
  },
);

ticketsRouter.post("/tickets/:id/claim", requireRole("tecnico"), (req, res) => {
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
  requireRole("tecnico", "administrador"),
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

ticketsRouter.get("/mttr-real", requireRole("administrador"), (_req, res) => {
  res.json(getRealDemoMttr());
});
