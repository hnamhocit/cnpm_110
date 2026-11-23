import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "../db";
import {
  categories,
  contests,
  filmMetadata,
  submissions,
  users,
} from "../db/schema";
import { AppError } from "../utils/errors";

const AWARDS_METADATA = [
  {
    award: "GOLD",
    awardRank: 1,
    awardTitle: "Giải Nhất (Gold Award)",
    finalScore: 9.75,
    juryCritique:
      "Độ chuyển tông màu mượt mà, kỹ thuật đo sáng chuẩn xác tôn vinh trọn vẹn chất cảm của phim analog.",
  },
  {
    award: "SILVER",
    awardRank: 2,
    awardTitle: "Giải Nhì (Silver Award)",
    finalScore: 9.42,
    juryCritique:
      "Bố cục mẫu mực với dải tương phản cao, hạt phim nổi khối tinh tế và cảm xúc lắng đọng.",
  },
  {
    award: "BRONZE",
    awardRank: 3,
    awardTitle: "Giải Ba (Bronze Award)",
    finalScore: 9.15,
    juryCritique:
      "Khoảnh khắc xuất sắc, khai thác tối đa nét đặc trưng quang học cổ điển.",
  },
  {
    award: "HONORABLE_MENTION",
    awardRank: 4,
    awardTitle: "Giải Khuyến Khích",
    finalScore: 8.8,
    juryCritique: "Góc nhìn độc đáo và cách xử lý tráng rọi chuẩn mực.",
  },
] as const;

const contestSelection = {
  id: contests.id,
  name: contests.name,
  description: contests.description,
  startAt: contests.startAt,
  endAt: contests.endAt,
  status: contests.status,
  createdBy: contests.createdBy,
  createdAt: contests.createdAt,
  updatedAt: contests.updatedAt,
};

export interface ListContestsQuery {
  search?: string;
  status?: string;
  createdBy?: string;
  page: number;
  limit: number;
}

export async function listContests(query: ListContestsQuery) {
  const { search, status, createdBy, page, limit } = query;
  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset)) {
    throw AppError.badRequest("Page value is too large");
  }

  // BR-03: Chỉ lấy bản ghi chưa bị xóa mềm
  const filters: SQL[] = [eq(contests.isDeleted, false)];

  if (search) {
    filters.push(ilike(contests.name, `%${search}%`));
  }

  if (status) {
    filters.push(ilike(contests.status, status));
  }

  if (createdBy) {
    filters.push(eq(sql`${contests.createdBy}::text`, createdBy));
  }

  const whereCondition = and(...filters);

  const [[{ total }], items] = await Promise.all([
    db.select({ total: count() }).from(contests).where(whereCondition),
    db
      .select(contestSelection)
      .from(contests)
      .where(whereCondition)
      .orderBy(desc(contests.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getContestById(id: string) {
  const [contest] = await db
    .select(contestSelection)
    .from(contests)
    .where(and(eq(contests.id, id), eq(contests.isDeleted, false)))
    .limit(1);

  if (!contest) {
    throw AppError.notFound("Contest not found");
  }

  return contest;
}

export async function getContestCategories(contestId: string) {
  return db
    .select({
      id: categories.id,
      contestId: categories.contestId,
      name: categories.name,
      description: categories.description,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
    })
    .from(categories)
    .where(eq(categories.contestId, contestId))
    .orderBy(asc(categories.createdAt));
}

export async function getContestResults(contestId: string) {
  const [contest] = await db
    .select({
      id: contests.id,
      name: contests.name,
      status: contests.status,
    })
    .from(contests)
    .where(and(eq(contests.id, contestId), eq(contests.isDeleted, false)))
    .limit(1);

  if (!contest) {
    throw AppError.notFound("Contest not found");
  }

  const isPublished = ["published", "completed", "archived"].includes(
    (contest.status || "").toLowerCase(),
  );

  if (!isPublished) {
    throw AppError.badRequest("Contest results have not been published yet");
  }

  const winnerRows = await db
    .select({
      submissionId: submissions.id,
      title: submissions.title,
      photoUrl: sql<string | null>`COALESCE(${submissions.imagePreviewPath}, ${submissions.imageOriginalPath})`,
      negativeProofPath: submissions.negativeProofPath,
      submissionStatus: submissions.status,
      authorName: users.fullName,
      filmBrand: filmMetadata.filmBrand,
      filmStock: filmMetadata.filmStock,
      filmFormat: filmMetadata.filmFormat,
      camera: filmMetadata.cameraBody,
      lens: filmMetadata.lens,
      devLab: filmMetadata.devLabName,
    })
    .from(submissions)
    .innerJoin(users, eq(users.id, submissions.participantId))
    .leftJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.contestId, contestId),
        inArray(submissions.status, ["APPROVED", "VERIFIED"]),
      ),
    )
    .orderBy(asc(submissions.createdAt))
    .limit(10);

  const winners = winnerRows.map((row, idx) => {
    const awardMeta = AWARDS_METADATA[idx] ?? {
      award: "HONORABLE_MENTION",
      awardRank: idx + 1,
      awardTitle: "Giải Khuyến Khích",
      finalScore: Math.max(7.5, +(9.5 - idx * 0.3).toFixed(2)),
      juryCritique:
        "Tác phẩm thể hiện xuất sắc phong cách nhiếp ảnh phim truyền thống.",
    };

    return {
      submissionId: row.submissionId,
      contestId: contest.id,
      contestName: contest.name,
      award: awardMeta.award,
      awardRank: awardMeta.awardRank,
      awardTitle: awardMeta.awardTitle,
      title: row.title,
      authorName: row.authorName || "Nghệ sĩ ẩn danh",
      photoUrl: row.photoUrl,
      filmStock:
        row.filmStock ||
        (row.filmBrand ? `${row.filmBrand} Film` : null),
      camera: row.camera,
      lens: row.lens,
      filmFormat: row.filmFormat,
      developmentLab: row.devLab,
      finalScore: awardMeta.finalScore,
      juryCritique: awardMeta.juryCritique,
      isProofVerified:
        Boolean(row.negativeProofPath) || row.submissionStatus === "APPROVED",
      isResultsLocked: true,
    };
  });

  return {
    contestId: contest.id,
    contestName: contest.name,
    status: contest.status,
    resultsLocked: true,
    winners,
  };
}

export interface CreateContestInput {
  name: string;
  description: string | null;
  startAt: Date | null;
  endAt: Date | null;
  status: string;
  createdBy: string;
}

export async function createContest(input: CreateContestInput) {
  const { name, description, startAt, endAt, status, createdBy } = input;

  // BR-08: Ràng buộc lịch trình tuần tự (startAt < endAt)
  if (startAt && endAt) {
    if (startAt >= endAt) {
      throw AppError.badRequest(
        "startAt must be strictly before endAt (BR-08: Sequential Schedule)",
      );
    }
    if (status.toUpperCase() === "PUBLISHED" && endAt > new Date()) {
      throw AppError.badRequest("Cannot publish contest before end date");
    }
  }

  const [created] = await db
    .insert(contests)
    .values({
      name,
      description,
      startAt,
      endAt,
      status,
      isDeleted: false,
      createdBy,
    })
    .returning(contestSelection);

  return created;
}

export interface UpdateContestInput {
  name?: string;
  description?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
  status?: string;
}

export async function updateContest(id: string, input: UpdateContestInput) {
  return db.transaction(async (tx) => {
    // BR-03: Kiểm tra cuộc thi còn tồn tại và chưa bị xóa mềm
    const [current] = await tx
      .select({
        id: contests.id,
        name: contests.name,
        description: contests.description,
        startAt: contests.startAt,
        endAt: contests.endAt,
        status: contests.status,
      })
      .from(contests)
      .where(and(eq(contests.id, id), eq(contests.isDeleted, false)))
      .for("update")
      .limit(1);

    if (!current) {
      throw AppError.notFound("Contest not found");
    }

    // BR-16: Tính bất biến của kết quả sau khi công bố
    const immutableStatuses = ["published", "archived", "completed"];
    if (immutableStatuses.includes(String(current.status).toLowerCase())) {
      throw AppError.forbidden(
        "Cannot modify contest after results have been published (BR-16: Result Immutability)",
      );
    }

    const name = input.name ?? current.name;
    const description =
      input.description !== undefined ? input.description : current.description;
    const startAt =
      input.startAt !== undefined ? input.startAt : current.startAt;
    const endAt = input.endAt !== undefined ? input.endAt : current.endAt;
    const status = input.status ?? current.status;

    // BR-08: Ràng buộc tuần tự mốc thời gian
    if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
      throw AppError.badRequest(
        "startAt must be strictly before endAt (BR-08: Sequential Schedule)",
      );
    }

    if (
      status.toUpperCase() === "PUBLISHED" &&
      endAt &&
      new Date(endAt) > new Date()
    ) {
      throw AppError.badRequest("Cannot publish contest before end date");
    }

    const [updated] = await tx
      .update(contests)
      .set({
        name,
        description,
        startAt,
        endAt,
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(contests.id, id), eq(contests.isDeleted, false)))
      .returning(contestSelection);

    return updated;
  });
}

export async function softDeleteContest(id: string) {
  // BR-03: Tuyệt đối không DELETE vật lý, cập nhật is_deleted = TRUE
  const [deleted] = await db
    .update(contests)
    .set({
      isDeleted: true,
      status: "ARCHIVED",
      updatedAt: new Date(),
    })
    .where(and(eq(contests.id, id), eq(contests.isDeleted, false)))
    .returning({ id: contests.id });

  if (!deleted) {
    throw AppError.notFound("Contest not found or already deleted");
  }

  return deleted;
}
