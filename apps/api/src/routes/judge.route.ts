
import { Hono } from "hono";
import {
  handleGetAssignedSubmissions,
  handleGetAssignedImage,
  handleSubmitEvaluation,
  handleLockJudgeAssignment,
} from "../controllers/judge.controller";
import {
  authenticate,
  requirePermission,
  type AuthEnv,
} from "../middlewares/auth";

const judge = new Hono<AuthEnv>();

judge.get(
  "/assignments",
  authenticate,
  requirePermission("judging:read_assigned"),
  handleGetAssignedSubmissions,
);
judge.get(
  "/submissions/:submissionId/image",
  authenticate,
  requirePermission("judging:read_assigned"),
  handleGetAssignedImage,
);
judge.post(
  "/submissions/:submissionId/evaluation",
  authenticate,
  requirePermission("judging:score"),
  handleSubmitEvaluation,
);
judge.post(
  "/assignments/:assignmentId/lock",
  authenticate,
  requirePermission("judging:lock"),
  handleLockJudgeAssignment,
);
export default judge;
