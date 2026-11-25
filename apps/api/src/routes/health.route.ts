
import { Hono } from "hono";
import { getHealthStatus } from "../services/health.service";

const healthRoute = new Hono();

healthRoute.get("/", async (c) => {
  const health = await getHealthStatus();

  return c.ok(health)
});

export default healthRoute;
