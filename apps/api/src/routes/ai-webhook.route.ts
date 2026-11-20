import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { handleAiWebhook } from "../controllers/ai-webhook.controller";
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

export default route;
