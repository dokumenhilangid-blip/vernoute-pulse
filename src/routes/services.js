import { Hono } from "hono";
import { getServices, getServiceById } from "../db.js";

export const servicesRouter = new Hono();

servicesRouter.get("/services", async (c) => {
  const services = await getServices(c.env);
  return c.json({ services });
});

servicesRouter.get("/services/:id", async (c) => {
  const id = c.req.param("id");
  const service = await getServiceById(c.env, id);
  if (!service) {
    return c.json({ error: "Service not found" }, 404);
  }
  return c.json(service);
});
