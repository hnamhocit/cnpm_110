import { Hono } from "hono";
import { handleListAuditLogs } from "../controllers/audit-logs.controller";
import {
  authenticate,
  requirePermission,
  type AuthEnv,
} from "../middlewares/auth";

const auditLogs = new Hono<AuthEnv>();

auditLogs.use("*", authenticate, requirePermission("audit-logs:read"));
auditLogs.get("/", handleListAuditLogs);

export default auditLogs;
