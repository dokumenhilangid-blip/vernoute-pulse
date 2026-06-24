import { Router } from "express";
import { getServices, getServiceById } from "../db.js";

export const servicesRouter = Router();

servicesRouter.get("/services", (_req, res) => {
  try {
    const services = getServices();
    res.json({ services });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch services", detail: error.message });
  }
});

servicesRouter.get("/services/:id", (req, res) => {
  try {
    const service = getServiceById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch service", detail: error.message });
  }
});
