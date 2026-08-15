import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { metaRouter } from "./routes/meta.js";
import { ticketsRouter } from "./routes/tickets.js";
import { simulationRouter } from "./routes/simulation.js";
import { maintenanceEventsRouter } from "./routes/maintenanceEvents.js";
import { requireAuth } from "./auth.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", authRouter);
app.use("/api", requireAuth, metaRouter);
app.use("/api", requireAuth, ticketsRouter);
app.use("/api", requireAuth, simulationRouter);
app.use("/api", requireAuth, maintenanceEventsRouter);
