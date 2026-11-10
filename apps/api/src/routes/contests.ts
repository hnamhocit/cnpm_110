import { Hono } from "hono";
import { pool } from "../db";
import {
  authenticate,
  requireRoles,
  type AuthEnv,
} from "../middlewares/auth";

const contests = new Hono<AuthEnv>();

// 6 trạng thái chuẩn theo Module 03 & SRS, kèm các alias chữ thường để tương thích ngược
const VALID_STATUSES = [
  "DRAFT",
  "OPEN",
  "UNDER_REVIEW",
  "JUDGING",
  "PUBLISHED",
  "ARCHIVED",
  "CANCELLED",
  "draft",
  "open",
  "under_review",
  "judging",
  "published",
  "archived",
  "cancelled",
  "ongoing",
  "completed",
];

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

// GET /contests - Tra cứu danh sách cuộc thi kèm phân trang và tìm kiếm
contests.get("/", async (c) => {
  const search = c.req.query("search")?.trim();
  const status = c.req.query("status")?.trim();
  const pageParam = c.req.query("page") ?? "1";
  const limitParam = c.req.query("limit") ?? "10";

  if (!/^[1-9]\d*$/.test(pageParam)) {
    return c.json(
      { code: 400, message: "Page must be a positive integer", data: null, error: "Page must be a positive integer" },
      400,
    );
  }

  if (!/^[1-9]\d*$/.test(limitParam)) {
    return c.json(
      { code: 400, message: "Limit must be a positive integer", data: null, error: "Limit must be a positive integer" },
      400,
    );
  }

  const page = Number(pageParam);
  const limit = Number(limitParam);

  if (!Number.isSafeInteger(page)) {
    return c.json(
      { code: 400, message: "Invalid page value", data: null, error: "Invalid page value" },
      400,
    );
  }

  if (!Number.isSafeInteger(limit) || limit > 100) {
    return c.json(
      { code: 400, message: "Limit must be between 1 and 100", data: null, error: "Limit must be between 1 and 100" },
      400,
    );
  }

  if (status && !VALID_STATUSES.some((s) => s.toLowerCase() === status.toLowerCase())) {
    return c.json(
      {
        code: 400,
        message: "Invalid contest status filter",
        data: null,
        error: "Invalid contest status filter",
      },
      400,
    );
  }

  try {
    // BR-03: Chỉ lấy các bản ghi chưa bị xóa mềm
    const conditions = ["is_deleted = FALSE"];
    const params: (string | number)[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`status ILIKE $${params.length}`);
    }

    const whereClause = conditions.join(" AND ");

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM contests
       WHERE ${whereClause}`,
      params,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) {
      return c.json(
        { code: 400, message: "Page value is too large", data: null, error: "Page value is too large" },
        400,
      );
    }

    const listParams = [...params, limit, offset];

    const result = await pool.query(
      `SELECT id, name, description, start_at, end_at, status,
              created_by, created_at, updated_at
       FROM contests
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      listParams,
    );

    // Cấu trúc envelope chuẩn hóa theo docs/09-api-contracts.md Section 4.1
    return c.json({
      code: 200,
      message: "Contests retrieved successfully",
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get contests failed:", error);
    return c.json(
      { code: 500, message: "Failed to get contests", data: null, error: "Failed to get contests" },
      500,
    );
  }
});

// GET /contests/:id - Chi tiết cuộc thi
contests.get("/:id", async (c) => {
  const { id } = c.req.param();

  try {
    // BR-03: Không đọc bản ghi đã bị xóa mềm
    const result = await pool.query(
      `SELECT id, name, description, start_at, end_at, status,
              created_by, created_at, updated_at
       FROM contests
       WHERE id = $1 AND is_deleted = FALSE`,
      [id],
    );

    if (!result.rowCount) {
      return c.json(
        { code: 404, message: "Contest not found", data: null, error: "Contest not found" },
        404,
      );
    }

    return c.json({
      code: 200,
      message: "Contest retrieved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get contest failed:", error);
    return c.json(
      { code: 500, message: "Failed to get contest", data: null, error: "Failed to get contest" },
      500,
    );
  }
});

// POST /contests - Tạo cuộc thi mới (Admin, Organizer)
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
    return c.json(
      { code: 400, message: "Invalid JSON body", data: null, error: "Invalid JSON body" },
      400,
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : null;
  const status = body.status === undefined ? "draft" : body.status;

  if (!name || name.length > 150) {
    return c.json(
      {
        code: 400,
        message: "Name is required and must be at most 150 characters",
        data: null,
        error: "Name is required and must be at most 150 characters",
      },
      400,
    );
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    return c.json(
      { code: 400, message: "Description must be a string or null", data: null, error: "Description must be a string or null" },
      400,
    );
  }

  if (
    typeof status !== "string" ||
    !VALID_STATUSES.some((s) => s.toLowerCase() === status.toLowerCase())
  ) {
    return c.json(
      { code: 400, message: "Invalid contest status", data: null, error: "Invalid contest status" },
      400,
    );
  }

  if (
    body.startAt !== undefined &&
    body.startAt !== null &&
    !isValidDate(body.startAt)
  ) {
    return c.json(
      { code: 400, message: "Invalid startAt date", data: null, error: "Invalid startAt date" },
      400,
    );
  }

  if (
    body.endAt !== undefined &&
    body.endAt !== null &&
    !isValidDate(body.endAt)
  ) {
    return c.json(
      { code: 400, message: "Invalid endAt date", data: null, error: "Invalid endAt date" },
      400,
    );
  }

  const startAt =
    typeof body.startAt === "string" ? new Date(body.startAt) : null;
  const endAt = typeof body.endAt === "string" ? new Date(body.endAt) : null;

  // BR-08: Ràng buộc lịch trình tuần tự (startAt < endAt)
  if (startAt && endAt && startAt >= endAt) {
    return c.json(
      {
        code: 400,
        message: "startAt must be strictly before endAt (BR-08: Sequential Schedule)",
        data: null,
        error: "startAt must be strictly before endAt (BR-08: Sequential Schedule)",
      },
      400,
    );
  }

  const user = c.get("user");

  try {
    const result = await pool.query(
      `INSERT INTO contests
         (name, description, start_at, end_at, status, is_deleted, created_by)
       VALUES ($1, $2, $3, $4, $5, FALSE, $6)
       RETURNING id, name, description, start_at, end_at, status,
                 created_by, created_at, updated_at`,
      [name, description, startAt, endAt, status, user.id],
    );

    return c.json(
      {
        code: 201,
        message: "Contest created successfully",
        data: result.rows[0],
      },
      201,
    );
  } catch (error) {
    console.error("Create contest failed:", error);
    return c.json(
      { code: 500, message: "Failed to create contest", data: null, error: "Failed to create contest" },
      500,
    );
  }
});

// PUT /contests/:id - Cập nhật thông tin cuộc thi (Admin, Organizer)
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
      return c.json(
        { code: 400, message: "Invalid JSON body", data: null, error: "Invalid JSON body" },
        400,
      );
    }

    if (
      body.name === undefined &&
      body.description === undefined &&
      body.startAt === undefined &&
      body.endAt === undefined &&
      body.status === undefined
    ) {
      return c.json(
        { code: 400, message: "At least one field is required", data: null, error: "At least one field is required" },
        400,
      );
    }

    if (
      body.name !== undefined &&
      (typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.trim().length > 150)
    ) {
      return c.json(
        { code: 400, message: "Invalid contest name", data: null, error: "Invalid contest name" },
        400,
      );
    }

    if (
      body.description !== undefined &&
      body.description !== null &&
      typeof body.description !== "string"
    ) {
      return c.json(
        { code: 400, message: "Description must be a string or null", data: null, error: "Description must be a string or null" },
        400,
      );
    }

    if (
      body.status !== undefined &&
      (typeof body.status !== "string" ||
        !VALID_STATUSES.some((s) => s.toLowerCase() === (body.status as string).toLowerCase()))
    ) {
      return c.json(
        { code: 400, message: "Invalid contest status", data: null, error: "Invalid contest status" },
        400,
      );
    }

    if (
      body.startAt !== undefined &&
      body.startAt !== null &&
      !isValidDate(body.startAt)
    ) {
      return c.json(
        { code: 400, message: "Invalid startAt date", data: null, error: "Invalid startAt date" },
        400,
      );
    }

    if (
      body.endAt !== undefined &&
      body.endAt !== null &&
      !isValidDate(body.endAt)
    ) {
      return c.json(
        { code: 400, message: "Invalid endAt date", data: null, error: "Invalid endAt date" },
        400,
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // BR-03: Kiểm tra cuộc thi còn tồn tại và chưa bị xóa mềm
      const existing = await client.query(
        `SELECT id, name, description, start_at, end_at, status
         FROM contests
         WHERE id = $1 AND is_deleted = FALSE
         FOR UPDATE`,
        [id],
      );

      if (!existing.rowCount) {
        await client.query("ROLLBACK");
        return c.json(
          { code: 404, message: "Contest not found", data: null, error: "Contest not found" },
          404,
        );
      }

      const current = existing.rows[0];

      // BR-16: Tính bất biến của kết quả - Khi cuộc thi ở trạng thái PUBLISHED hoặc ARCHIVED, cấm chỉnh sửa dữ liệu
      const immutableStatuses = ["published", "archived", "completed"];
      if (immutableStatuses.includes(String(current.status).toLowerCase())) {
        await client.query("ROLLBACK");
        return c.json(
          {
            code: 403,
            message: "Cannot modify contest after results have been published (BR-16: Result Immutability)",
            data: null,
            error: "Cannot modify contest after results have been published (BR-16: Result Immutability)",
          },
          403,
        );
      }

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

      // BR-08: Ràng buộc tuần tự mốc thời gian
      if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
        await client.query("ROLLBACK");
        return c.json(
          {
            code: 400,
            message: "startAt must be strictly before endAt (BR-08: Sequential Schedule)",
            data: null,
            error: "startAt must be strictly before endAt (BR-08: Sequential Schedule)",
          },
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
         WHERE id = $6 AND is_deleted = FALSE
         RETURNING id, name, description, start_at, end_at, status,
                   created_by, created_at, updated_at`,
        [name, description, startAt, endAt, status, id],
      );

      await client.query("COMMIT");

      return c.json({
        code: 200,
        message: "Contest updated successfully",
        data: updated.rows[0],
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Bỏ qua lỗi rollback
      }

      console.error("Update contest failed:", error);
      return c.json(
        { code: 500, message: "Failed to update contest", data: null, error: "Failed to update contest" },
        500,
      );
    } finally {
      client.release();
    }
  },
);

// DELETE /contests/:id - Xóa mềm cuộc thi (BR-03: Soft Delete Only)
contests.delete(
  "/:id",
  authenticate,
  requireRoles("Admin", "Organizer"),
  async (c) => {
    const { id } = c.req.param();

    try {
      // BR-03: Tuyệt đối không DELETE vật lý, cập nhật is_deleted = TRUE
      const result = await pool.query(
        `UPDATE contests
         SET is_deleted = TRUE,
             updated_at = NOW()
         WHERE id = $1 AND is_deleted = FALSE
         RETURNING id`,
        [id],
      );

      if (!result.rowCount) {
        return c.json(
          { code: 404, message: "Contest not found or already deleted", data: null, error: "Contest not found or already deleted" },
          404,
        );
      }

      return c.json({
        code: 200,
        message: "Contest deleted successfully (BR-03: Soft Delete)",
        data: { id: result.rows[0].id },
      });
    } catch (error) {
      console.error("Delete contest failed:", error);
      return c.json(
        { code: 500, message: "Failed to delete contest", data: null, error: "Failed to delete contest" },
        500,
      );
    }
  },
);

export default contests;
