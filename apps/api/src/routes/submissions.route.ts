import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import {
  handleApproveSubmission,
  handleCreateSubmission,
  handleGetMySubmissions,
  handleGetSubmissionComparison,
  handleListSubmissions,
  handleModerateSubmission,
  handleRejectSubmission,
} from "../controllers/submission.controller";
import {
  authenticate,
  requireRoles,
  type AuthEnv,
} from "../middlewares/auth";
import { AppError } from "../utils/errors";

const MiB = 1024 * 1024;
const route = new Hono<AuthEnv>();

route.get("/my", authenticate, requireRoles("Participant"), handleGetMySubmissions);

route.get(
  "/",
  authenticate,
  requireRoles("Organizer"),
  handleListSubmissions,
);

route.post(
  "/",
  authenticate,
  requireRoles("Participant"),
  bodyLimit({
    maxSize: 121 * MiB,
    onError: () => {
      throw new AppError("Request exceeds 121 MiB", 413);
    },
  }),
  handleCreateSubmission,
);

route.post(
  "/:id/approve",
  authenticate,
  requireRoles("Organizer"),
  handleApproveSubmission,
);

route.post(
  "/:id/reject",
  authenticate,
  requireRoles("Organizer"),
  handleRejectSubmission,
);

route.post(
  "/:id/moderate",
  authenticate,
  requireRoles("Organizer"),
  handleModerateSubmission,
);

route.get(
  "/:id/comparison",
  authenticate,
  requireRoles("Organizer", "Admin"),
  handleGetSubmissionComparison,
);

route.get(
  "/:id/ai-analysis",
  authenticate,
  requireRoles("Organizer", "Admin"),
  handleGetSubmissionComparison,
);

export default route;
