
import { Hono } from "hono";
import { getHealthStatus } from "../services/health.service";

const healthRoute = new Hono();

healthRoute.get("/", async (c) => {
  const health = await getHealthStatus();
  const { httpStatus, ...response } = health;

  return c.json(response, httpStatus);
});

export default healthRoute;
