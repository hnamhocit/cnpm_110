import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  readonly code: ContentfulStatusCode;

  constructor(message: string, code: ContentfulStatusCode = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }

  static badRequest(msg = "Bad Request") {
    return new AppError(msg, 400);
  }

  static unauthorized(msg = "Unauthorized") {
    return new AppError(msg, 401);
  }

  static forbidden(msg = "Forbidden") {
    return new AppError(msg, 403);
  }

  static notFound(msg = "Not Found") {
    return new AppError(msg, 404);
  }

  static conflict(msg = "Conflict") {
    return new AppError(msg, 409);
  }
}
