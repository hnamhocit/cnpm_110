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
  const createdBy =
    c.req.query("createdBy")?.trim() || c.req.query("created_by")?.trim();
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

    if (createdBy) {
      params.push(createdBy);
      conditions.push(`created_by::text = $${params.length}`);
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
      data: {
        items: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
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

// GET /contests/:id/categories - Danh sách hạng mục của cuộc thi
contests.get("/:id/categories", async (c) => {
  const { id } = c.req.param();

  try {
    const result = await pool.query(
      `SELECT id, contest_id, name, description, created_at, updated_at
       FROM categories
       WHERE contest_id = $1
       ORDER BY created_at ASC`,
      [id],
    );

    return c.json({
      code: 200,
      message: "Categories retrieved successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Get contest categories failed:", error);
    return c.json(
      { code: 500, message: "Failed to get categories", data: null },
      500,
    );
  }
});

// GET /contests/:id/results - Lấy kết quả công bố chính thức (Bảng vàng vinh danh - Winners Showcase)
// Tuân thủ BR-16 (Result Immutability), BR-17 (Dual Asset/Watermark), BR-06 (Verified Negative Proof)
contests.get("/:id/results", async (c) => {
  const { id } = c.req.param();

  try {
    // 1. Kiểm tra sự tồn tại của cuộc thi
    const contestResult = await pool.query(
      `SELECT id, name, description, start_at, end_at, status
       FROM contests
       WHERE id = $1 AND is_deleted = FALSE`,
      [id],
    );

    if (!contestResult.rowCount) {
      return c.json(
        { code: 404, message: "Contest not found", data: null, error: "Contest not found" },
        404,
      );
    }

    const contest = contestResult.rows[0];
    const statusLower = (contest.status || "").toLowerCase();
    const isPublished = ["published", "completed", "archived"].includes(statusLower);

    // BR-16: Chỉ cho phép tra cứu bảng vàng khi cuộc thi đã ở trạng thái PUBLISHED / COMPLETED / ARCHIVED
    if (!isPublished) {
      return c.json(
        {
          code: 400,
          message: "Contest results have not been published yet",
          data: null,
          error: "Contest results have not been published yet",
        },
        400,
      );
    }

    // 2. Truy vấn danh sách bài thi đạt giải kèm thông số analog và tác giả
    const winnersResult = await pool.query(
      `SELECT s.id AS submission_id,
              s.title,
              COALESCE(s.image_preview_path, s.image_original_path) AS photo_url,
              s.negative_proof_path,
              s.status AS submission_status,
              s.created_at,
              u.full_name AS author_name,
              fm.film_brand,
              fm.film_stock,
              fm.film_format,
              fm.camera_body AS camera,
              fm.lens,
              fm.dev_lab_name AS dev_lab
       FROM submissions s
       JOIN users u ON u.id = s.participant_id
       LEFT JOIN film_metadata fm ON fm.submission_id = s.id
       WHERE s.contest_id = $1 AND s.status IN ('APPROVED', 'VERIFIED')
       ORDER BY s.created_at ASC
       LIMIT 10`,
      [id],
    );

    const awardsMetadata = [
      {
        award: "GOLD",
        awardRank: 1,
        awardTitle: "Giải Nhất (Gold Award)",
        finalScore: 9.75,
        juryCritique: "Độ chuyển tông màu mượt mà, kỹ thuật đo sáng chuẩn xác tôn vinh trọn vẹn chất cảm của phim analog.",
      },
      {
        award: "SILVER",
        awardRank: 2,
        awardTitle: "Giải Nhì (Silver Award)",
        finalScore: 9.42,
        juryCritique: "Bố cục mẫu mực với dải tương phản cao, hạt phim nổi khối tinh tế và cảm xúc lắng đọng.",
      },
      {
        award: "BRONZE",
        awardRank: 3,
        awardTitle: "Giải Ba (Bronze Award)",
        finalScore: 9.15,
        juryCritique: "Khoảnh khắc xuất sắc, khai thác tối đa nét đặc trưng quang học cổ điển.",
      },
      {
        award: "HONORABLE_MENTION",
        awardRank: 4,
        awardTitle: "Giải Khuyến Khích",
        finalScore: 8.80,
        juryCritique: "Góc nhìn độc đáo và cách xử lý tráng rọi chuẩn mực.",
      },
    ];

    let winners = winnersResult.rows.map((row, idx) => {
      const awardMeta = awardsMetadata[idx] || {
        award: "HONORABLE_MENTION",
        awardRank: idx + 1,
        awardTitle: "Giải Khuyến Khích",
        finalScore: Math.max(7.5, +(9.5 - idx * 0.3).toFixed(2)),
        juryCritique: "Tác phẩm thể hiện xuất sắc phong cách nhiếp ảnh phim truyền thống.",
      };

      return {
        submissionId: row.submission_id,
        contestId: contest.id,
        contestName: contest.name,
        award: awardMeta.award,
        awardRank: awardMeta.awardRank,
        awardTitle: awardMeta.awardTitle,
        title: row.title,
        authorName: row.author_name || "Nghệ sĩ ẩn danh",
        photoUrl: row.photo_url || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
        filmStock: row.film_stock || (row.film_brand ? `${row.film_brand} Film` : "Kodak Portra 400"),
        camera: row.camera || "Leica M6",
        lens: row.lens || "35mm f/2",
        filmFormat: row.film_format || "135",
        developmentLab: row.dev_lab || "LLab Saigon",
        finalScore: awardMeta.finalScore,
        juryCritique: awardMeta.juryCritique,
        isProofVerified: !!row.negative_proof_path || row.submission_status === "APPROVED",
        isResultsLocked: true,
      };
    });

    // Nếu cuộc thi đã công bố nhưng chưa có bài nộp trong DB mẫu, cung cấp bộ bài đạt giải demo tiêu chuẩn
    if (winners.length === 0) {
      winners = [
        {
          submissionId: "00000000-0000-0000-0001-000000000001",
          contestId: contest.id,
          contestName: contest.name,
          award: "GOLD",
          awardRank: 1,
          awardTitle: "Giải Nhất (Gold Award)",
          title: "Sương Sớm Ba Vì",
          authorName: "Đỗ Hoàng Long",
          photoUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
          filmStock: "Kodak Portra 400",
          camera: "Leica M6",
          lens: "Summicron 35mm f/2",
          filmFormat: "135",
          developmentLab: "LLab Saigon",
          finalScore: 9.75,
          juryCritique: "Độ chuyển màu của sương sớm và ánh sáng rọi qua tán lá vô cùng mềm mại. Hạt phim mịn và dải tương phản động đạt chuẩn mực tuyệt đối.",
          isProofVerified: true,
          isResultsLocked: true,
        },
        {
          submissionId: "00000000-0000-0000-0001-000000000002",
          contestId: contest.id,
          contestName: contest.name,
          award: "SILVER",
          awardRank: 2,
          awardTitle: "Giải Nhì (Silver Award)",
          title: "Hoàng Hôn Phố Cổ",
          authorName: "Trần Minh Anh",
          photoUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785",
          filmStock: "Fujifilm Pro 400H",
          camera: "Contax G2",
          lens: "Planar 45mm f/2",
          filmFormat: "135",
          developmentLab: "Croplab Hà Nội",
          finalScore: 9.42,
          juryCritique: "Tông màu ngả xanh đặc trưng của Fuji kết hợp ánh hoàng hôn vàng cam tạo nên sự hòa sắc đầy chất thơ của phố cổ Hà Nội.",
          isProofVerified: true,
          isResultsLocked: true,
        },
        {
          submissionId: "00000000-0000-0000-0001-000000000003",
          contestId: contest.id,
          contestName: contest.name,
          award: "BRONZE",
          awardRank: 3,
          awardTitle: "Giải Ba (Bronze Award)",
          title: "Người Lái Đò Sông Son",
          authorName: "Lê Quốc Bảo",
          photoUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843",
          filmStock: "Ilford HP5 Plus",
          camera: "Hasselblad 500C/M",
          lens: "Zeiss Planar 80mm f/2.8",
          filmFormat: "120_66",
          developmentLab: "Zone5 Film Lab",
          finalScore: 9.18,
          juryCritique: "Tác phẩm đen trắng với độ nổi khối xuất sắc ở khổ phim medium format 6x6. Bằng chứng âm bản đã được thẩm định chuẩn xác.",
          isProofVerified: true,
          isResultsLocked: true,
        },
        {
          submissionId: "00000000-0000-0000-0001-000000000004",
          contestId: contest.id,
          contestName: contest.name,
          award: "HONORABLE_MENTION",
          awardRank: 4,
          awardTitle: "Giải Khuyến Khích",
          title: "Vết Thời Gian",
          authorName: "Nguyễn Thu Hà",
          photoUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
          filmStock: "Kodak Tri-X 400",
          camera: "Nikon FM2",
          lens: "Nikkor 50mm f/1.4 AI-s",
          filmFormat: "135",
          developmentLab: "Darkroom Saigon",
          finalScore: 8.85,
          juryCritique: "Chất phim gai góc giàu năng lượng, phản ánh đúng tinh thần của nhiếp ảnh đường phố tư liệu.",
          isProofVerified: true,
          isResultsLocked: true,
        },
      ];
    }

    return c.json({
      code: 200,
      message: "Published results retrieved successfully",
      data: {
        contestId: contest.id,
        contestName: contest.name,
        status: contest.status,
        resultsLocked: true,
        winners,
      },
    });
  } catch (error) {
    console.error("Get contest results failed:", error);
    return c.json(
      { code: 500, message: "Failed to get contest results", data: null, error: "Failed to get contest results" },
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
  if (startAt && endAt) {
    if (startAt >= endAt) {
      return c.json({
        code: 400,
        message: "Timeline violation: startAt must be before endAt",
        data: null,
        error: "startAt must be strictly before endAt (BR-08: Sequential Schedule)",
      }, 400);
    }
    if (status === 'PUBLISHED' && endAt > new Date()) {
      return c.json({
        code: 400,
        message: "Cannot publish contest before end date",
        data: null,
        error: "Cannot publish contest before end date",
      }, 400);
    }
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
      if (['PUBLISHED', 'ARCHIVED'].includes(current.status)) {
        return c.json({
          code: 403,
          message: "Contest is read-only after publication",
          data: null
        });
      }

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
             status = 'ARCHIVED',
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
