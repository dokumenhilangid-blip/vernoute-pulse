import { Hono } from "hono";
import { getOverviewData } from "../db.js";

export const overviewRouter = new Hono();

overviewRouter.get("/overview", async (c) => {
  const data = await getOverviewData(c.env);
  return c.json(data);
});
