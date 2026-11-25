import { Hono } from "hono";
import {
  handleGetMe,
  handleGetPortfolio,
  handleLogin,
  handleLogout,
  handleRefresh,
  identityHandlers,
} from "../controllers/auth.controller";
import type { IdentityDelivery } from "../services/identity-delivery";
import { authenticate, requirePermission, type AuthEnv } from "../middlewares/auth";

export function createAuthRoutes(delivery?: IdentityDelivery) {
  const auth = new Hono<AuthEnv>();
  const identity = identityHandlers(delivery);

  auth.post("/register", identity.register);
  auth.post("/verify-email", identity.verifyEmail);
  auth.post("/resend-verification", identity.resendVerification);
  auth.post("/forgot-password", identity.forgotPassword);
  auth.post("/reset-password", identity.resetPassword);
  auth.post("/login", handleLogin);
  auth.post("/refresh", handleRefresh);
  auth.post("/logout", handleLogout);
  auth.get("/me", authenticate, requirePermission("users:read_own_profile"), handleGetMe);
  auth.get("/portfolio", authenticate, requirePermission("portfolio:read_own"), handleGetPortfolio);

  return auth;
}

export default createAuthRoutes();
