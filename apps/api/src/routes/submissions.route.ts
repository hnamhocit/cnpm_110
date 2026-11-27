import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import {
  handleApproveSubmission,
  handleEditSubmission,
  handleGetContestNotifications,
  handleGetSubmissionFeedback,
  handleGetSubmissionProofDetail,
  handleGetSubmissionProofImage,
  handleRequestSubmissionProof,
  handleUploadSubmissionProof,
  handleVerifySubmissionProof,
  handleWithdrawSubmission,
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

route.get("/my/notifications", authenticate, requirePermission("submissions:read_own"), handleGetContestNotifications);
route.get("/:id/feedback", authenticate, requirePermission("submissions:read_own"), handleGetSubmissionFeedback);
route.get("/:id/result", authenticate, requirePermission("submissions:read_own"), handleGetSubmissionFeedback);
route.get("/:id", authenticate, handleGetSubmissionProofDetail);
route.patch("/:id", authenticate, requirePermission("submissions:read_own"), handleEditSubmission);
route.post("/:id/withdraw", authenticate, requirePermission("submissions:read_own"), handleWithdrawSubmission);
route.delete("/:id", authenticate, requirePermission("submissions:read_own"), handleWithdrawSubmission);
route.get("/:id/proof/image", authenticate, handleGetSubmissionProofImage);
route.post("/:id/request-proof", authenticate, requirePermission("submissions:moderate"), handleRequestSubmissionProof);
route.post("/:id/proof", authenticate, requirePermission("submissions:read_own"), bodyLimit({
  maxSize: 21 * MiB,
  onError: () => { throw new AppError("Proof request exceeds 21 MiB", 413); },
}), handleUploadSubmissionProof);
route.post("/:id/verify-proof", authenticate, requirePermission("submissions:moderate"), handleVerifySubmissionProof);

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
