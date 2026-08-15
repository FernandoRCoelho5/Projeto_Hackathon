import { Router } from "express";
import { requireRole } from "../auth.js";
import { isAutoModeEnabled, setAutoMode } from "../simulation.js";

export const simulationRouter = Router();

simulationRouter.get("/simulation/status", (_req, res) => {
  res.json({ autoMode: isAutoModeEnabled() });
});

simulationRouter.post("/simulation/toggle", requireRole("team-leader"), (req, res) => {
  const { enabled } = req.body ?? {};
  if (typeof enabled !== "boolean") {
    res.status(400).json({ error: "Campo 'enabled' (boolean) é obrigatório." });
    return;
  }
  setAutoMode(enabled);
  res.json({ autoMode: isAutoModeEnabled() });
});
