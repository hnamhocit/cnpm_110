
import { Hono } from "hono";
import { handleGetAssignedSubmissions } from "../controllers/judge.controller";
import {
  authenticate,
  requireRoles,
  type AuthEnv,
} from "../middlewares/auth";

const judge = new Hono<AuthEnv>();

judge.get(
  "/assignments",
  authenticate,
  requireRoles("Judge"),
  handleGetAssignedSubmissions,
);

export default judge;
