import type { Context } from "hono";
import type { AuthEnv } from "../middlewares/auth";
import { listAuditLogs } from "../services/audit-logs.service";

export async function handleListAuditLogs(c: Context<AuthEnv>) {
  const pageRaw = c.req.query("page");
  const limitRaw = c.req.query("limit");
  const page = pageRaw ? Number.parseInt(pageRaw, 10) : undefined;
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

  const result = await listAuditLogs({
    action: c.req.query("action") || undefined,
    entityType:
      c.req.query("entityType") || c.req.query("entity_type") || undefined,
    actorId: c.req.query("actorId") || c.req.query("actor_id") || undefined,
    from: c.req.query("from") || undefined,
    to: c.req.query("to") || undefined,
    search: c.req.query("search") || undefined,
    page: Number.isFinite(page) ? page : undefined,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return c.ok(result);
}
