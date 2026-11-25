import { Hono } from "hono";
import { authenticate, requirePermission, requireRoles, type AuthEnv } from "../middlewares/auth";
import { canGrant, permissionNames, systemRoles } from "../services/permission-policy";

const rbac = new Hono<AuthEnv>();
rbac.use("*", authenticate);

rbac.get("/manage-contest", requirePermission("contests:portal"), (c) => {
  return c.ok(null, "Bạn được phép truy cập cổng quản trị");
});

rbac.get("/roles", requireRoles("Admin"), (c) => c.ok(
  systemRoles.map((role) => {
    const permissions = permissionNames.filter((permission) => canGrant(role, permission));
    return { role, permissions, availablePermissions: permissions };
  }),
));

export default rbac;
