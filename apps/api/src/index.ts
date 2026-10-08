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

export default {
  port: 8080,
  fetch: app.fetch,
};
