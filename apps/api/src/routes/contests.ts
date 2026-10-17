
import { Hono } from "hono";
import { pool } from "../db";
import {
  authenticate,
  requireRoles,
  type AuthEnv,
} from "../middlewares/auth";

const contests = new Hono<AuthEnv>();

const VALID_STATUSES = ["draft", "published", "ongoing", "completed", "cancelled"];

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

// GET /contests - Lấy danh sách cuộc thi
contests.get("/", async (c) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, start_at, end_at, status,
              created_by, created_at, updated_at
       FROM contests
       ORDER BY created_at DESC`,
    );

    return c.json({ data: result.rows });
  } catch (error) {
    console.error("Get contests failed:", error);
    return c.json({ error: "Failed to get contests" }, 500);
  }
});

// GET /contests/:id - Lấy chi tiết cuộc thi
contests.get("/:id", async (c) => {
  const { id } = c.req.param();

  try {
    const result = await pool.query(
      `SELECT id, name, description, start_at, end_at, status,
              created_by, created_at, updated_at
       FROM contests
       WHERE id = $1`,
      [id],
    );

    if (!result.rowCount) {
      return c.json({ error: "Contest not found" }, 404);
    }

    return c.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Get contest failed:", error);
    return c.json({ error: "Failed to get contest" }, 500);
  }
});

// POST /contests - Tạo cuộc thi
contests.post("/", authenticate, requireRoles("Admin", "Organizer"), async (c) => {
  let body: {
    name?: unknown;
    description?: unknown;
    startAt?: unknown;
    endAt?: unknown;
    status?: unknown;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : null;
  const status = body.status === undefined ? "draft" : body.status;

  if (!name || name.length > 150) {
    return c.json(
      { error: "Name is required and must be at most 150 characters" },
      400,
    );
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    return c.json({ error: "Description must be a string or null" }, 400);
  }

  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    return c.json({ error: "Invalid contest status" }, 400);
  }

  if (
    body.startAt !== undefined &&
    body.startAt !== null &&
    !isValidDate(body.startAt)
  ) {
    return c.json({ error: "Invalid startAt date" }, 400);
  }

  if (
    body.endAt !== undefined &&
    body.endAt !== null &&
    !isValidDate(body.endAt)
  ) {
    return c.json({ error: "Invalid endAt date" }, 400);
  }

  const startAt =
    typeof body.startAt === "string" ? new Date(body.startAt) : null;
  const endAt = typeof body.endAt === "string" ? new Date(body.endAt) : null;

  if (startAt && endAt && startAt > endAt) {
    return c.json({ error: "startAt must be before or equal to endAt" }, 400);
  }

  const user = c.get("user");

  try {
    const result = await pool.query(
      `INSERT INTO contests
         (name, description, start_at, end_at, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, start_at, end_at, status,
                 created_by, created_at, updated_at`,
      [name, description, startAt, endAt, status, user.id],
    );

    return c.json({ message: "Contest created successfully", data: result.rows[0] }, 201);
  } catch (error) {
    console.error("Create contest failed:", error);
    return c.json({ error: "Failed to create contest" }, 500);
  }
});

// PUT /contests/:id - Cập nhật cuộc thi
contests.put(
  "/:id",
  authenticate,
  requireRoles("Admin", "Organizer"),
  async (c) => {
    const { id } = c.req.param();

    let body: {
      name?: unknown;
      description?: unknown;
      startAt?: unknown;
      endAt?: unknown;
      status?: unknown;
    };

    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    if (
      body.name === undefined &&
      body.description === undefined &&
      body.startAt === undefined &&
      body.endAt === undefined &&
      body.status === undefined
    ) {
      return c.json({ error: "At least one field is required" }, 400);
    }

    if (
      body.name !== undefined &&
      (typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.trim().length > 150)
    ) {
      return c.json({ error: "Invalid contest name" }, 400);
    }

    if (
      body.description !== undefined &&
      body.description !== null &&
      typeof body.description !== "string"
    ) {
      return c.json({ error: "Description must be a string or null" }, 400);
    }

    if (
      body.status !== undefined &&
      (typeof body.status !== "string" ||
        !VALID_STATUSES.includes(body.status))
    ) {
      return c.json({ error: "Invalid contest status" }, 400);
    }

    if (
      body.startAt !== undefined &&
      body.startAt !== null &&
      !isValidDate(body.startAt)
    ) {
      return c.json({ error: "Invalid startAt date" }, 400);
    }

    if (
      body.endAt !== undefined &&
      body.endAt !== null &&
      !isValidDate(body.endAt)
    ) {
      return c.json({ error: "Invalid endAt date" }, 400);
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existing = await client.query(
        `SELECT id, name, description, start_at, end_at, status
         FROM contests
         WHERE id = $1
         FOR UPDATE`,
        [id],
      );

      if (!existing.rowCount) {
        await client.query("ROLLBACK");
        return c.json({ error: "Contest not found" }, 404);
      }

      const current = existing.rows[0];

      const name =
        body.name === undefined ? current.name : (body.name as string).trim();
      const description =
        body.description === undefined
          ? current.description
          : body.description;
      const startAt =
        body.startAt === undefined
          ? current.start_at
          : body.startAt === null
            ? null
            : new Date(body.startAt as string);
      const endAt =
        body.endAt === undefined
          ? current.end_at
          : body.endAt === null
            ? null
            : new Date(body.endAt as string);
      const status =
        body.status === undefined ? current.status : body.status;

      if (startAt && endAt && new Date(startAt) > new Date(endAt)) {
        await client.query("ROLLBACK");
        return c.json(
          { error: "startAt must be before or equal to endAt" },
          400,
        );
      }

      const updated = await client.query(
        `UPDATE contests
         SET name = $1,
             description = $2,
             start_at = $3,
             end_at = $4,
             status = $5,
             updated_at = NOW()
         WHERE id = $6
         RETURNING id, name, description, start_at, end_at, status,
                   created_by, created_at, updated_at`,
        [name, description, startAt, endAt, status, id],
      );

      await client.query("COMMIT");

      return c.json({
        message: "Contest updated successfully",
        data: updated.rows[0],
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Ignore rollback errors if the transaction has already ended.
      }

      console.error("Update contest failed:", error);
      return c.json({ error: "Failed to update contest" }, 500);
    } finally {
      client.release();
    }
  },
);

// DELETE /contests/:id - Xóa cuộc thi
contests.delete(
  "/:id",
  authenticate,
  requireRoles("Admin", "Organizer"),
  async (c) => {
    const { id } = c.req.param();

    try {
      const result = await pool.query(
        `DELETE FROM contests
         WHERE id = $1
         RETURNING id`,
        [id],
      );

      if (!result.rowCount) {
        return c.json({ error: "Contest not found" }, 404);
      }

      return c.json({ message: "Contest deleted successfully" });
    } catch (error) {
      console.error("Delete contest failed:", error);
      return c.json({ error: "Failed to delete contest" }, 500);
    }
  },
);

export default contests;
