import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { metaRouter } from "./routes/meta.js";
import { ticketsRouter } from "./routes/tickets.js";
import { simulationRouter } from "./routes/simulation.js";
import { maintenanceEventsRouter } from "./routes/maintenanceEvents.js";
import { documentsRouter } from "./routes/documents.js";
import { usersRouter } from "./routes/users.js";
import { requireAuth } from "./auth.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", authRouter);
// Documentos (manual da máquina / protocolo de correção) são material de
// referência, não dado sensível — ficam públicos pra abrir direto num
// `<a href>` em nova aba, sem precisar injetar o Bearer token.
app.use("/api", documentsRouter);
app.use("/api", requireAuth, metaRouter);
app.use("/api", requireAuth, ticketsRouter);
app.use("/api", requireAuth, simulationRouter);
app.use("/api", requireAuth, maintenanceEventsRouter);
app.use("/api", requireAuth, usersRouter);
