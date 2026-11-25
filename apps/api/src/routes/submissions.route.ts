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
  requirePermission,
  type AuthEnv,
} from "../middlewares/auth";
import { AppError } from "../utils/errors";

const MiB = 1024 * 1024;
const route = new Hono<AuthEnv>();

route.get("/my", authenticate, requirePermission("submissions:read_own"), handleGetMySubmissions);

route.get(
  "/",
  authenticate,
  requirePermission("submissions:list"),
  handleListSubmissions,
);

route.post(
  "/",
  authenticate,
  requirePermission("submissions:create"),
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
  requirePermission("submissions:moderate"),
  handleApproveSubmission,
);

route.post(
  "/:id/reject",
  authenticate,
  requirePermission("submissions:moderate"),
  handleRejectSubmission,
);

route.post(
  "/:id/moderate",
  authenticate,
  requirePermission("submissions:moderate"),
  handleModerateSubmission,
);

route.get(
  "/:id/comparison",
  authenticate,
  requirePermission("submissions:read_ai"),
  handleGetSubmissionComparison,
);

route.get(
  "/:id/ai-analysis",
  authenticate,
  requirePermission("submissions:read_ai"),
  handleGetSubmissionComparison,
);

export default route;
