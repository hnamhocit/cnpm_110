
import { Hono } from "hono";
import {
  handleGetAssignedSubmissions,
  handleSubmitEvaluation,
} from "../controllers/judge.controller";
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
judge.post(
  "/submissions/:submissionId/evaluation",
  authenticate,
  requireRoles("Judge"),
  handleSubmitEvaluation,
);
export default judge;
