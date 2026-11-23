import type { Context, MiddlewareHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
  error: string | null;
}

declare module "hono" {
  interface Context {
    ok: <T>(data: T, message?: string, code?: ContentfulStatusCode) => Response;
    created: <T>(data: T, message?: string) => Response;
  }
}

export const attachResponseHelpers: MiddlewareHandler = async (c, next) => {
  c.ok = <T>(
    data: T,
    message = "Success",
    code: ContentfulStatusCode = 200,
  ) => {
    return c.json<ApiResponse<T>>(
      { code, message, data, error: null },
      code,
    );
  };

  c.created = <T>(data: T, message = "Created") => {
    return c.json<ApiResponse<T>>(
      { code: 201, message, data, error: null },
      201,
    );
  };

  await next();
};

export function errorResponse(
  c: Context,
  error: string,
  code: ContentfulStatusCode = 400,
): Response {
  return c.json<ApiResponse<null>>(
    { code, message: error, data: null, error },
    code,
  );
}
