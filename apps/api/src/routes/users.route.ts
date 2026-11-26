import { Hono } from "hono";
import {
  handleChangePassword,
  handleGetMe,
  handleListAccounts,
  handleUpdateAccountStatus,
  handleUpdateAccountRole,
  handleUpdateProfile,
  identityHandlers,
} from "../controllers/auth.controller";
import { authenticate, requirePermission, type AuthEnv } from "../middlewares/auth";
import type { IdentityDelivery } from "../services/identity-delivery";

export function createUserRoutes(delivery?: IdentityDelivery) {
  const users = new Hono<AuthEnv>();
  users.use("*", authenticate);

  users.get("/", requirePermission("users:read_all"), handleListAccounts);
  users.post("/", requirePermission("users:create_internal"), identityHandlers(delivery).createInternal);
  users.get("/me", requirePermission("users:read_own_profile"), handleGetMe);
  users.patch("/me/password", requirePermission("users:change_password"), handleChangePassword);
  users.put("/me/profile", requirePermission("users:update_own_profile"), handleUpdateProfile);
  users.patch("/:id/status", requirePermission("users:lock_unlock"), handleUpdateAccountStatus);
  users.patch("/:id/role", requirePermission("users:assign_role"), handleUpdateAccountRole);
  return users;
}

export default createUserRoutes();
