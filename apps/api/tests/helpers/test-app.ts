import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError } from "../../src/utils/errors";
import { attachResponseHelpers, errorResponse } from "../../src/utils/result";

export function createTestApp() {
  const app = new Hono();

  app.use("*", attachResponseHelpers);

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return errorResponse(c, err.message, err.code);
    }

    if (err instanceof HTTPException) {
      return errorResponse(c, err.message, err.status as ContentfulStatusCode);
    }

    return errorResponse(c, "Internal Server Error", 500);
  });

  app.notFound((c) => errorResponse(c, "Route not found", 404));

  return app;
}
