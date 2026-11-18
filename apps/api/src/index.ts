import { serveStatic } from "hono/bun";
import { authenticate, requireRoles } from "./middlewares/auth";
import { uploadToR2 } from "./r2";
import { Hono } from "hono";
import auth from "./routes/auth";
import contests from "./routes/contests";
import healthRoute from "./routes/health.route";
import submissionRoute from "./routes/submissions";
import aiWebhookRoute from "./routes/ai-webhook";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import { timing } from "hono/timing";

const app = new Hono();

app.use("*", cors());
app.use("/uploads/*", serveStatic({ root: "./" }));
app.use("*", secureHeaders({ crossOriginResourcePolicy: false }));
app.use("*", requestId());
app.use('*', async (c, next) => {
  await next();
  const contentType = c.res.headers.get('content-type') || c.res.headers.get('Content-Type');
  if (contentType?.includes('application/json')) {
    try {
      const clonedRes = c.res.clone();
      const text = await clonedRes.text();
      if (!text || !text.trim()) return;
      const body = JSON.parse(text);
      if (body && typeof body === 'object' && 'code' in body && ('data' in body || 'message' in body)) {
        return;
      }
      const newHeaders = new Headers(c.res.headers);
      newHeaders.set('content-type', 'application/json; charset=UTF-8');
      c.res = new Response(JSON.stringify({
        code: c.res.status,
        message: body?.message || (c.res.status < 400 ? 'Success' : (body?.error || 'Error')),
        data: body?.data !== undefined ? body.data : body,
        error: body?.error || (c.res.status >= 400 ? (body?.message || 'Error') : null)
      }), {
        status: c.res.status,
        headers: newHeaders,
      });
    } catch {
      // Keep original response
    }
  }
});
app.use("*", logger());
app.use("*", timing());
app.use("*", compress());

app.route("/health", healthRoute);
app.route("/api/v1/auth", auth);
app.route("/api/v1/contests", contests);
app.route("/api/v1/submissions", submissionRoute);
app.route("/api/v1/ai", aiWebhookRoute);
app.route("/api/v1/organizer/submissions", submissionRoute);

app.get("/", (c) => c.text("Hello Hono!"));


app.post("/api/v1/upload", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "Invalid image type" }, 400);
    }

    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
      return c.json({ error: "File exceeds 50MB" }, 413);
    }

    if (file.size === 0) {
      return c.json({ error: "Empty file" }, 400);
    }

    const extension = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    }[file.type];

    const key = `images/${crypto.randomUUID()}.${extension}`;

    await uploadToR2(file, key);

    return c.json({
      message: "Upload successful",
      key,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

// API kiểm tra phân quyền RBAC cho Portal
app.use("/api/v1/rbac/*", authenticate);

app.get(
  "/api/v1/rbac/manage-contest",
  requireRoles("Admin", "Organizer"),
  (c) => {
    return c.json({
      message: "Bạn được phép quản lý cuộc thi",
    });
  },
);

export default {
  port: 8080,
  fetch: app.fetch,
};
