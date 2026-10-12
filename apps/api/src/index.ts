import { Hono } from "hono";
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

app.use(requestId());
app.use(logger());
app.use(timing());
app.use(secureHeaders());
app.use(cors());
app.use(compress());

app.get("/", (c) => c.text("Hello Hono!"));

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
