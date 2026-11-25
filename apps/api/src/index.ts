import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { authenticate, requireRoles } from "./middlewares/auth";
import aiWebhookRoute from "./routes/ai-webhook.route";
import authRoute from "./routes/auth.route";
import contestsRoute from "./routes/contests.route";
import healthRoute from "./routes/health.route";
import judgeRoute from "./routes/judge.route";
import submissionRoute from "./routes/submissions.route";
import uploadRoute from "./routes/upload.route";
import { AppError } from "./utils/errors";
import { attachResponseHelpers, errorResponse } from "./utils/result";
import { seed } from "./db/seed";

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

seed()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exitCode = 1;
  });

// 4. API v1 Route Group
const v1 = new Hono();

v1.route("/auth", authRoute);
v1.route("/contests", contestsRoute);
v1.route("/judge", judgeRoute);
v1.route("/submissions", submissionRoute);
v1.route("/organizer/submissions", submissionRoute);
v1.route("/ai", aiWebhookRoute);
v1.route("/upload", uploadRoute)

const rbac = new Hono();
rbac.use("*", authenticate);
rbac.get("/manage-contest", requireRoles("Admin", "Organizer"), (c) => {
  return c.ok(null, "Bạn được phép truy cập cổng quản trị");
});

v1.route("/rbac", rbac);
app.route("/api/v1", v1);

// 5. Server & Graceful Shutdown
const port = Number(process.env.PORT) || 8080;

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`Server running on http://localhost:${server.port}`);

let isShuttingDown = false;

const shutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  try {
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
