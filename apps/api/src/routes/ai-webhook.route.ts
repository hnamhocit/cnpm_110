import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { handleAiWebhook } from "../controllers/ai-webhook.controller";
import {
  handleGetAiThresholds,
  handleTriggerBatchAiScan,
  handleTriggerSingleAiScan,
  handleUpdateAiThresholds,
} from "../controllers/ai.controller";
import { authenticate, requireRoles } from "../middlewares/auth";
import { AppError } from "../utils/errors";

const route = new Hono();

route.post(
  "/webhook",
  bodyLimit({
    maxSize: 64 * 1024,
    onError: () => {
      throw new AppError("Payload too large", 413);
    },
  }),
  handleAiWebhook,
);

// UC-09: Configure AI Thresholds (Admin)
route.get(
  "/thresholds",
  authenticate,
  requireRoles("Admin", "Organizer"),
  handleGetAiThresholds,
);
route.put(
  "/thresholds",
  authenticate,
  requireRoles("Admin"),
  handleUpdateAiThresholds,
);

// UC-19: Trigger AI Verification Scan (Single & Batch)
route.post(
  "/scan/batch",
  authenticate,
  requireRoles("Admin", "Organizer"),
  handleTriggerBatchAiScan,
);
route.post(
  "/scan/:submissionId",
  authenticate,
  requireRoles("Admin", "Organizer"),
  handleTriggerSingleAiScan,
);

export default route;
