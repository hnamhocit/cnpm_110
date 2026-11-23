import { Hono } from "hono";
import {
  handleGetMe,
  handleGetPortfolio,
  handleLogin,
  handleLogout,
  handleRefresh,
  handleRegister,
} from "../controllers/auth.controller";
import { authenticate, type AuthEnv } from "../middlewares/auth";

const auth = new Hono<AuthEnv>();

auth.post("/register", handleRegister);
auth.post("/login", handleLogin);
auth.post("/refresh", handleRefresh);
auth.post("/logout", handleLogout);
auth.get("/me", authenticate, handleGetMe);
auth.get("/portfolio", authenticate, handleGetPortfolio);

export default auth;
