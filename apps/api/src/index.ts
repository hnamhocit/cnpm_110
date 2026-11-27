import { env } from "./config/env";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import aiWebhookRoute from "./routes/ai-webhook.route";
import authRoute from "./routes/auth.route";
import contestsRoute from "./routes/contests.route";
import exhibitionsRoute from "./routes/exhibitions.route";
import rbacRoute from "./routes/rbac.route";
import usersRoute from "./routes/users.route";
import healthRoute from "./routes/health.route";
import judgeRoute from "./routes/judge.route";
import masterDataRoute from "./routes/master-data.route";
import submissionRoute from "./routes/submissions.route";
import uploadRoute from "./routes/upload.route";
import { AppError } from "./utils/errors";
import { attachResponseHelpers, errorResponse } from "./utils/result";
import { seed } from "./db/seed";
import { startNotificationDelivery } from "./services/notification-delivery";

const app = new Hono();

// 1. Global Middlewares
app.use("*", requestId());
app.use("*", logger());
app.use("*", timing());
app.use("*", cors());
app.use("*", secureHeaders({ crossOriginResourcePolicy: false }));
app.use("*", compress());
app.use("*", attachResponseHelpers);

// 2. Centralized Error & 404 Handler
app.onError((err, c) => {
  if (err instanceof AppError) {
    return errorResponse(c, err.message, err.code);
  }

  if (err instanceof HTTPException) {
    return errorResponse(c, err.message, err.status as ContentfulStatusCode);
  }

  console.error("[Unhandled Error]:", err);
  return errorResponse(c, "Internal Server Error", 500);
});

app.notFound((c) => errorResponse(c, "Route not found", 404));

// 3. Health Check
app.route("/health", healthRoute);

// 4. API v1 Route Group
const v1 = new Hono();

v1.route("/auth", authRoute);
v1.route("/users", usersRoute);
v1.route("/contests", contestsRoute);
v1.route("/exhibitions", exhibitionsRoute);
v1.route("/judge", judgeRoute);
v1.route("/submissions", submissionRoute);
v1.route("/organizer/submissions", submissionRoute);
v1.route("/ai", aiWebhookRoute);
v1.route("/upload", uploadRoute)

v1.route("/rbac", rbacRoute);
v1.route("/master-data", masterDataRoute);
app.route("/api/v1", v1);

// 5. Server & Graceful Shutdown
const port = env.port;

await seed();

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`Server running on http://localhost:${server.port}`);

const stopNotificationDelivery = startNotificationDelivery();
let isShuttingDown = false;

const shutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  try {
    await stopNotificationDelivery();
    await server.stop();
    console.log("HTTP server closed.");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
