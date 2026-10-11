import { uploadToR2 } from "./r2";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import { timing } from "hono/timing";

const app = new Hono();

app.use(requestId());
app.use(logger());
app.use(timing());
app.use(secureHeaders());
app.use(cors());
app.use(compress());

app.get("/", (c) => c.text("Hello Hono!"));


app.post("/upload", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

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

export default {
  port: 8080,
  fetch: app.fetch,
};
