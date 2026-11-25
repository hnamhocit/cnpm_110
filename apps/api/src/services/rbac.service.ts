import { eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { accountAuditLogs, permissions, rolePermissions, roles, userRoles } from "../db/schema";
import type { Role } from "../middlewares/auth";
import { AppError } from "../utils/errors";
import { revokeAccountSessions } from "./auth.service";
import { canGrant, permissionNames, systemRoles, type Permission } from "./permission-policy";

type Executor = Pick<typeof db, "select">;

async function storedPermissions(executor: Executor, roleId: string) {
  const grants = await executor.select({ name: permissions.name })
    .from(rolePermissions).innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(rolePermissions.roleId, roleId));
  return new Set(grants.map(({ name }) => name));
}

export async function listRolePermissions() {
  const configuredRoles = await db.select().from(roles).where(inArray(roles.name, [...systemRoles]));
  return Promise.all(systemRoles.map(async (name) => {
    const row = configuredRoles.find((role) => role.name === name);
    const allowed = permissionNames.filter((permission) => canGrant(name, permission));
    const active = row?.permissionsConfigured ? await storedPermissions(db, row.id) : new Set(allowed);
    return { role: name, availablePermissions: allowed, permissions: allowed.filter((permission) => active.has(permission)) };
  }));
}

export async function updateRolePermissions(actorId: string, name: Role, requested: Permission[]) {
  if (requested.some((permission) => !canGrant(name, permission))) {
    throw AppError.badRequest("Permission is outside the role's allowed scope");
  }
  return db.transaction(async (tx) => {
    const [role] = await tx.select().from(roles).where(eq(roles.name, name)).for("update");
    if (!role) throw AppError.notFound("Role not found");
    const allowed = permissionNames.filter((permission) => canGrant(name, permission));
    const previous = role.permissionsConfigured ? await storedPermissions(tx, role.id) : new Set(allowed);
    const granted = allowed.filter((permission) => requested.includes(permission));
    if (previous.size === granted.length && granted.every((permission) => previous.has(permission))) {
      return { role: name, permissions: granted };
    }

    if (granted.length) {
      await tx.insert(permissions).values(granted.map((permission) => ({ name: permission })))
        .onConflictDoNothing({ target: permissions.name });
    }
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
    if (granted.length) {
      const rows = await tx.select({ id: permissions.id }).from(permissions).where(inArray(permissions.name, granted));
      await tx.insert(rolePermissions).values(rows.map(({ id }) => ({ roleId: role.id, permissionId: id })));
    }
    await tx.update(roles).set({ permissionsConfigured: true }).where(eq(roles.id, role.id));

    // Revoke sessions in a stable account order when role scopes overlap.
    const members = await tx.select({ userId: userRoles.userId }).from(userRoles)
      .where(eq(userRoles.roleId, role.id)).orderBy(userRoles.userId);
    for (const { userId } of members) await revokeAccountSessions(tx, userId);
    await tx.insert(accountAuditLogs).values({
      actorId, accountId: actorId, action: "ROLE_PERMISSIONS_UPDATED",
      changes: { role: name, previous: Array.from(previous), current: granted },
    });
    return { role: name, permissions: granted };
  });
}
