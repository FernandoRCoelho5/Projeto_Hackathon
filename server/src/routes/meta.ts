import { Router } from "express";
import { MACHINES } from "../data/machines.js";
import { TECHNICIANS } from "../data/technicians.js";

export const metaRouter = Router();

metaRouter.get("/machines", (_req, res) => {
  res.json(MACHINES);
});

metaRouter.get("/technicians", (_req, res) => {
  res.json(TECHNICIANS);
});
