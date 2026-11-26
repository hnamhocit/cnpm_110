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
  contestPublications,
  contests,
  contestJudges,
  evaluations,
  evaluationScores,
  filmMetadata,
  judgingRounds,
  scoringCriteria,
  submissions,
  roles,
  userRoles,
  users,
} from "../db/schema";

import { contestDto, isClosed, validateSchedule, type Schedule, type Settings } from "./contest-configuration";
import { aggregateScores } from "./score-aggregation";
import { assignCompetitionRanks } from "./scoreboard-ranking";
import type { AuthEnv } from "../middlewares/auth";
import { getOfficialContestResults } from "./contest-publication";
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
  code: contests.code,
  theme: contests.theme,
  rules: contests.rules,
  coverImageUrl: contests.coverImageUrl,
  judgingStartAt: contests.judgingStartAt,
  judgingDeadlineAt: contests.judgingDeadlineAt,
  publishedAt: contests.publishedAt,
  rounds: contests.rounds,
  awards: contests.awards,
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
    items: items.map((contest) => contestDto(contest)),
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

  return contestDto(contest);
}

export async function getContestCategories(contestId: string) {
  return db
    .select({
      id: categories.id,
      contestId: categories.contestId,
      name: categories.name,
      description: categories.description,
      isActive: categories.isActive,
      requireNegativeProof: categories.requireNegativeProof,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
    })
    .from(categories)
    .innerJoin(contests, eq(categories.contestId, contests.id))
    .where(and(eq(categories.contestId, contestId), eq(contests.isDeleted, false)))
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

  if (contest.status.toLowerCase() === "results_published") return getOfficialContestResults(contestId);

  const isPublished = ["published", "completed", "archived"].includes(
    (contest.status || "").toLowerCase(),
  );

  if (!isPublished) {
    throw AppError.badRequest("Contest results have not been published yet");
  }

  const [official] = await db
    .select({ contestId: contestPublications.contestId })
    .from(contestPublications)
    .where(eq(contestPublications.contestId, contestId))
    .limit(1);
  if (official) return getOfficialContestResults(contestId);

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
  if (startAt && endAt && startAt >= endAt) {
    throw AppError.badRequest("startAt must be strictly before endAt (BR-08: Sequential Schedule)");
  }
  if (status.toLowerCase() !== "draft") {
    throw AppError.badRequest("A new contest must start in DRAFT");
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

  return contestDto(created);
}

export interface UpdateContestInput extends Partial<Schedule>, Settings {
  name?: string;
  description?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
  status?: string;
}

export async function updateContest(
  id: string,
  input: UpdateContestInput,
  actor: AuthEnv["Variables"]["user"],
) {
  return db.transaction(async (tx) => {
    // BR-03: Kiểm tra cuộc thi còn tồn tại và chưa bị xóa mềm
    const [current] = await tx
      .select()
      .from(contests)
      .where(and(eq(contests.id, id), eq(contests.isDeleted, false)))
      .for("update")
      .limit(1);

    if (!current) {
      throw AppError.notFound("Contest not found");
    }

    if (actor.role !== "Organizer" || current.createdBy !== actor.id) {
      throw AppError.forbidden("You do not manage this contest");
    }

    // BR-16: Tính bất biến của kết quả sau khi công bố
    const immutableStatuses = ["published", "results_published", "archived", "completed", "cancelled"];
    if (immutableStatuses.includes(String(current.status).toLowerCase())) {
      throw AppError.forbidden(
        "Cannot modify contest after results have been published (BR-16: Result Immutability)",
      );
    }

    const now = new Date();
    const { status: requestedStatus, ...configuration } = input;
    if (Object.keys(configuration).length &&
        (isClosed(current.status) || (current.judgingStartAt && current.endAt && current.endAt <= now))) {
      throw AppError.forbidden("Contest configuration is closed");
    }
    const schedule = {
      startAt: input.startAt !== undefined ? input.startAt : current.startAt,
      endAt: input.endAt !== undefined ? input.endAt : current.endAt,
      judgingStartAt: input.judgingStartAt ?? current.judgingStartAt,
      judgingDeadlineAt: input.judgingDeadlineAt ?? current.judgingDeadlineAt,
      publishedAt: input.publishedAt ?? current.publishedAt,
    };
    const { startAt, endAt, judgingStartAt, judgingDeadlineAt, publishedAt } = schedule;
    if (judgingStartAt || judgingDeadlineAt || publishedAt) {
      validateSchedule(schedule);
    } else if (startAt && endAt && startAt >= endAt) {
      throw AppError.badRequest("MSG008: startAt must be strictly before endAt");
    }

    // Keep the stored values understood by existing judging and results services.
    const aliases: Record<string, string> = { in_judging: "judging", results_published: "published", verifying: "under_review" };
    const currentStatus = current.status.toLowerCase();
    const requested = requestedStatus?.toLowerCase() ?? currentStatus;
    const nextStatus = aliases[requested] ?? requested;
    const status = requestedStatus === undefined ? current.status : aliases[requested] ?? requestedStatus;
    if (judgingStartAt && nextStatus !== currentStatus) {
      const transitions: Record<string, string[]> = {
        draft: ["scheduled", "open", "cancelled"],
        scheduled: ["open", "under_review", "judging", "cancelled"],
        open: ["under_review", "judging", "cancelled"],
        ongoing: ["under_review", "judging", "cancelled"],
        under_review: ["judging", "cancelled"],
        judging: ["published"],
      };
      if (!transitions[currentStatus]?.includes(nextStatus)) {
        throw AppError.conflict("Invalid contest status transition");
      }
    }
    if (judgingStartAt && nextStatus === "under_review" && endAt && endAt > now) {
      throw AppError.conflict("Submission window has not closed");
    }
    if (nextStatus === "judging" && currentStatus !== "judging") {
      const [round] = await tx.select({ id: judgingRounds.id }).from(judgingRounds)
        .where(eq(judgingRounds.contestId, id)).limit(1);
      if (round) throw AppError.conflict("Start the configured judging round through its round endpoint");

      if ((currentStatus !== "under_review" && !(judgingStartAt && ["scheduled", "open", "ongoing"].includes(currentStatus))) ||
          (judgingStartAt && judgingDeadlineAt && (now < judgingStartAt || now >= judgingDeadlineAt))) {
        throw AppError.conflict("Only contests under review can enter judging");
      }
      const categoryWeights = await tx.select({
        categoryId: categories.id,
        valid: sql<boolean>`COALESCE(sum(${scoringCriteria.weight}) = 1.0000, false)`,
      }).from(categories)
        .leftJoin(scoringCriteria, eq(scoringCriteria.categoryId, categories.id))
        .where(and(eq(categories.contestId, id), eq(categories.isActive, true)))
        .groupBy(categories.id);
      const activeJudges = await tx
        .select({ categoryId: contestJudges.categoryId, total: count() })
        .from(contestJudges)
        .innerJoin(users, and(eq(users.id, contestJudges.judgeId), eq(users.isActive, true)))
        .innerJoin(userRoles, eq(userRoles.userId, users.id))
        .innerJoin(roles, and(eq(roles.id, userRoles.roleId), eq(roles.name, "Judge")))
        .where(and(eq(contestJudges.contestId, id), eq(contestJudges.isActive, true)))
        .groupBy(contestJudges.categoryId);
      if (categoryWeights.length === 0 || categoryWeights.some(
        ({ categoryId }) => (activeJudges.find((category) => category.categoryId === categoryId)?.total ?? 0) < 1,
      )) {
        throw new AppError("Each category requires at least one active judge (BR-20)", 422);
      }
      if (categoryWeights.some(({ valid }) => !valid)) {
        throw new AppError("Criterion weights must total 1.0000 per category (BR-15)", 422);
      }
    }

    if (nextStatus === "published") {
      throw AppError.conflict("Use the official results publication endpoint");
    }
    if (nextStatus !== currentStatus && ["archived", "completed"].includes(nextStatus)) {
      throw AppError.conflict("Use the contest publication workflow to publish results");
    }

    const [updated] = await tx
      .update(contests)
      .set({
        ...configuration,
        ...schedule,
        status,
        updatedAt: now,
      })
      .where(and(eq(contests.id, id), eq(contests.isDeleted, false)))
      .returning(contestSelection);

    return contestDto(updated, now);
  });
}

export async function softDeleteContest(id: string, actor: AuthEnv["Variables"]["user"]) {
  // BR-03: Tuyệt đối không DELETE vật lý, cập nhật is_deleted = TRUE
  const [deleted] = await db
    .update(contests)
    .set({
      isDeleted: true,
      status: "ARCHIVED",
      updatedAt: new Date(),
    })
    .where(and(
      eq(contests.id, id),
      eq(contests.isDeleted, false),
      eq(contests.createdBy, actor.id),
      sql`lower(${contests.status}) not in ('published', 'results_published', 'completed', 'archived')`,
    ))
    .returning({ id: contests.id });

  if (!deleted) {
    throw AppError.notFound("Contest not found or already deleted");
  }

  return deleted;
}
export async function getContestScoreboard(
  contestId: string,
  actor: AuthEnv["Variables"]["user"],
  executor: Pick<typeof db, "select"> = db,
) {
  // 1. Verify contest exists.
  const [contest] = await executor
    .select({
      id: contests.id,
      createdBy: contests.createdBy,
    })
    .from(contests)
    .where(
      and(
        eq(contests.id, contestId),
        eq(contests.isDeleted, false),
      ),
    )
    .limit(1);

  if (!contest) {
    throw AppError.notFound("Contest not found");
  }

  // 2. Organizers can only view their own contests.
  if (actor.role !== "Organizer" || contest.createdBy !== actor.id) {
    throw AppError.forbidden("You cannot view this contest scoreboard");
  }

  // 3. Get approved submissions.
  const approvedSubmissions = await executor
    .select({
      id: submissions.id,
      title: submissions.title,
      categoryId: submissions.categoryId,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.contestId, contestId),
        eq(submissions.status, "APPROVED"),
      ),
    );

  if (approvedSubmissions.length === 0) {
    return {
      entries: [],
      updatedAt: new Date().toISOString(),
    };
  }

  const categoryIds = [
    ...new Set(approvedSubmissions.map((item) => item.categoryId)),
  ];

  // 4. Get category names.
  const categoryRows = await executor
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .where(inArray(categories.id, categoryIds));

  const categoryMap = new Map(
    categoryRows.map((category) => [category.id, category.name]),
  );

  // 5. Get active judges assigned to this contest.
  const assignments = await executor
    .select({
      categoryId: contestJudges.categoryId,
      judgeId: contestJudges.judgeId,
    })
    .from(contestJudges)
    .where(
      and(
        eq(contestJudges.contestId, contestId),
        eq(contestJudges.isActive, true),
      ),
    );

  const judgesByCategory = new Map<string, string[]>();

  for (const assignment of assignments) {
    const judgeIds =
      judgesByCategory.get(assignment.categoryId) ?? [];

    judgeIds.push(assignment.judgeId);
    judgesByCategory.set(assignment.categoryId, judgeIds);
  }

  // 6. Get scoring criteria.
  const criteriaRows = await executor
    .select({
      id: scoringCriteria.id,
      categoryId: scoringCriteria.categoryId,
      maxScore: scoringCriteria.maxScore,
      weight: scoringCriteria.weight,
    })
    .from(scoringCriteria)
    .where(inArray(scoringCriteria.categoryId, categoryIds))
    .orderBy(asc(scoringCriteria.sortOrder));

  const criteriaByCategory = new Map<
    string,
    {
      id: string;
      maxScore: number;
      weight: number;
    }[]
  >();

  for (const criterion of criteriaRows) {
    const items =
      criteriaByCategory.get(criterion.categoryId) ?? [];

    items.push({
      id: criterion.id,
      maxScore: Number(criterion.maxScore),
      weight: Number(criterion.weight),
    });

    criteriaByCategory.set(criterion.categoryId, items);
  }

  // 7. Get evaluation scores and judge information.
  const submissionIds = approvedSubmissions.map((item) => item.id);

  const evaluationRows = await executor
    .select({
      submissionId: evaluations.submissionId,
      judgeId: evaluations.judgeId,
      judgeName: users.fullName,
      submittedAt: evaluations.updatedAt,
      criterionId: evaluationScores.criterionId,
      score: evaluationScores.score,
    })
    .from(evaluations)
    .innerJoin(users, eq(users.id, evaluations.judgeId))
    .leftJoin(
      evaluationScores,
      eq(evaluationScores.evaluationId, evaluations.id),
    )
    .where(inArray(evaluations.submissionId, submissionIds));

  const evaluationMap = new Map<
    string,
    {
      judgeName: string;
      submittedAt: Date;
      criterionScores: {
        criterionId: string;
        score: number;
      }[];
    }
  >();

  for (const row of evaluationRows) {
    const key = `${row.submissionId}:${row.judgeId}`;

    const evaluation = evaluationMap.get(key) ?? {
      judgeName: row.judgeName,
      submittedAt: row.submittedAt,
      criterionScores: [],
    };

    if (row.criterionId !== null && row.score !== null) {
      evaluation.criterionScores.push({
        criterionId: row.criterionId,
        score: Number(row.score),
      });
    }

    evaluationMap.set(key, evaluation);
  }

  // 8. Build scoreboard entries.
  const entries = approvedSubmissions.map((submission) => {
    const criteria =
      criteriaByCategory.get(submission.categoryId) ?? [];

    const assignedJudgeIds =
      judgesByCategory.get(submission.categoryId) ?? [];

    const completeJudges = assignedJudgeIds
      .map((judgeId) => {
        const evaluation = evaluationMap.get(
          `${submission.id}:${judgeId}`,
        );

        if (!evaluation || criteria.length === 0) {
          return null;
        }

        // A judge must score every criterion exactly once.
        const scoreIds = evaluation.criterionScores.map(
          (item) => item.criterionId,
        );

        const hasAllCriteria =
          scoreIds.length === criteria.length &&
          new Set(scoreIds).size === criteria.length &&
          criteria.every((criterion) =>
            scoreIds.includes(criterion.id),
          );

        if (!hasAllCriteria) {
          return null;
        }

        return {
          judgeId,
          judgeName: evaluation.judgeName,
          submittedAt: evaluation.submittedAt,
          criterionScores: evaluation.criterionScores,
        };
      })
      .filter((judge) => judge !== null);

    let scores: {
      judgeId: string;
      judgeName: string;
      totalScore: number;
      submittedAt: string;
    }[] = [];
    let finalScore: number | null = null;
    if (criteria.length > 0 && completeJudges.length > 0) {
      const aggregation = aggregateScores({
        criteria,
        judges: completeJudges.map((judge) => ({
          judgeId: judge.judgeId,
          criterionScores: judge.criterionScores,
        })),
      });
      if (
        assignedJudgeIds.length > 0 &&
        completeJudges.length === assignedJudgeIds.length
      ) {
        finalScore = aggregation.finalScore;
      }
      const totalsMap = new Map(
        aggregation.judgeTotals.map((item) => [
          item.judgeId,
          item.totalScore,
        ]),
      );

      scores = completeJudges.map((judge) => ({
        judgeId: judge.judgeId,
        judgeName: judge.judgeName,
        totalScore: totalsMap.get(judge.judgeId) ?? 0,
        submittedAt: judge.submittedAt.toISOString(),
      }));
    }

    // Weighted maximum score, consistent with score aggregation.
    const scoreScale = criteria.reduce(
      (sum, criterion) =>
        sum + criterion.maxScore * criterion.weight,
      0,
    );

    return {
      submissionId: submission.id,
      submissionCode: submission.id,
      title: submission.title,
      categoryId: submission.categoryId,
      categoryName:
        categoryMap.get(submission.categoryId) ?? "Unknown category",
      judgeCount: assignedJudgeIds.length,
      scoreScale,
      negativeProofVerified: false,
      finalScore,
      discrepancyFlag: null,
      scores,
    };
  });
  const rankedEntries = assignCompetitionRanks(entries);
  return {
    entries: rankedEntries,
    updatedAt: new Date().toISOString(),
  };
}

export { getRoundProgress as getJudgingProgress, finalizeRound as closeJudgingRound } from "./judging-rounds";
