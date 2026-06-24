import { Router } from "express";
import { getOverview } from "../db.js";

export const overviewRouter = Router();

overviewRouter.get("/overview", (_req, res) => {
  try {
    const data = getOverview();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch overview", detail: error.message });
  }
});
