import { Hono } from "hono";
import { authenticate, requirePermission, requireRoles, type AuthEnv } from "../middlewares/auth";
import { permissionNames, systemRoles, type Permission } from "../services/permission-policy";
import { listRolePermissions, updateRolePermissions } from "../services/rbac.service";
import { AppError } from "../utils/errors";

const rbac = new Hono<AuthEnv>();
rbac.use("*", authenticate);

rbac.get("/manage-contest", requirePermission("contests:portal"), (c) => {
  return c.ok(null, "Bạn được phép truy cập cổng quản trị");
});

// Keep policy recovery available to Admin even if all editable grants are revoked.
rbac.get("/roles", requireRoles("Admin"), async (c) => c.ok(await listRolePermissions()));
rbac.put("/roles/:role/permissions", requireRoles("Admin"), async (c) => {
  const role = systemRoles.find((name) => name.toUpperCase() === c.req.param("role").toUpperCase());
  if (!role) throw AppError.notFound("Role not found");
  const body = await c.req.json().catch(() => null);
  const requested = body?.permissions;
  if (!Array.isArray(requested) || requested.length > permissionNames.length ||
      new Set(requested).size !== requested.length ||
      requested.some((permission) => !permissionNames.includes(permission))) {
    throw AppError.badRequest("Invalid permissions");
  }
  return c.ok(await updateRolePermissions(c.get("user").id, role, requested as Permission[]));
});

export default rbac;
