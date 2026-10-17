import { generateUploadUrl } from "./r2";
import { Hono } from "hono";
import auth from "./routes/auth";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import { timing } from "hono/timing";
import {
  authenticate,
  requireRoles,
  type AuthEnv,
} from "./middlewares/auth";

const app = new Hono();

// Global middleware phải được đăng ký trước các routes
app.use(requestId());
app.use(logger());
app.use(timing());
app.use(secureHeaders());
app.use(cors());
app.use(compress());

// Đăng ký API Auth theo chuẩn SRS v2.1
app.route("/api/v1/auth", auth);

app.get("/", (c) => c.text("Hello Hono!"));



app.post("/api/v1/storage/presigned-url", authenticate, async (c) => {
  try {
    const body = await c.req.json();
    const { filename, contentType, type, size } = body;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/tiff",
    ];

    if (
      typeof filename !== "string" ||
      typeof contentType !== "string" ||
      !["avatar", "submission", "proof"].includes(type) ||
      !Number.isSafeInteger(size) ||
      size <= 0
    ) {
      return c.json({ success: false, error: "Invalid request" }, 400);
    }

    if (!allowedTypes.includes(contentType)) {
      return c.json({ success: false, error: "Invalid image type" }, 400);
    }

    if (size > 50 * 1024 * 1024) {
      return c.json({ success: false, error: "File exceeds 50MB" }, 413);
    }

    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/tiff": "tiff",
    };

    const extension = extensions[contentType];

    // Tên file do server tạo để tránh ghi đè hoặc dùng đường dẫn tùy ý
    const key = `temp/${crypto.randomUUID()}.${extension}`;

    const uploadUrl = await generateUploadUrl(key, contentType);

    return c.json({
      success: true,
      data: {
        uploadUrl,
        key,
        expiresIn: 900,
      },
    });
  } catch (error) {
    console.error("Presigned URL failed:", error);

    return c.json(
      { success: false, error: "Cannot generate upload URL" },
      500
    );
  }
});
 

// Các API mẫu dùng để kiểm tra middleware.
app.use("/rbac/*", authenticate);

app.get("/rbac/admin", requireRoles("Admin"), (c) => {
  return c.json({ message: "Admin truy cập thành công" });
});

app.get("/rbac/organizer", requireRoles("Organizer"), (c) => {
  return c.json({ message: "Organizer truy cập thành công" });
});

app.get("/rbac/judge", requireRoles("Judge"), (c) => {
  return c.json({ message: "Judge truy cập thành công" });
});

app.get("/rbac/participant", requireRoles("Participant"), (c) => {
  return c.json({ message: "Participant truy cập thành công" });
});

// Ví dụ một API cho phép nhiều vai trò.
app.get(
  "/rbac/manage-contest",
  requireRoles("Admin", "Organizer"),
  (c) => {
    return c.json({ message: "Bạn được phép quản lý cuộc thi" });
  }
);

export default {
  port: 8080,
  fetch: app.fetch,
};
