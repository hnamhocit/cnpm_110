import { and, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { sign } from "hono/jwt";
import { createHash, randomBytes } from "node:crypto";

import { db } from "../db";
import {
  contests,
  filmMetadata,
  refreshTokens,
  roles,
  submissions,
  userRoles,
  users,
} from "../db/schema";
import type { Role } from "../middlewares/auth";
import { AppError } from "../utils/errors";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_DAYS = 7;

const VALID_ROLES: readonly Role[] = [
  "Admin",
  "Organizer",
  "Judge",
  "Participant",
];

const AWARD_TEMPLATES = [
  {
    award: "GOLD",
    awardRank: 1,
    awardTitle: "Giải Nhất (Gold Award)",
    finalScore: 9.75,
    juryCritique:
      "Độ chuyển tông màu mượt mà, kỹ thuật đo sáng chuẩn xác tôn vinh trọn vẹn chất cảm analog.",
  },
  {
    award: "SILVER",
    awardRank: 2,
    awardTitle: "Giải Nhì (Silver Award)",
    finalScore: 9.42,
    juryCritique:
      "Bố cục mẫu mực với dải tương phản cao, hạt phim nổi khối tinh tế.",
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
    juryCritique: "Góc nhìn sáng tạo và phong cách xử lý tráng rọi chuẩn mực.",
  },
] as const;

type DbExecutor = Pick<typeof db, "select" | "insert" | "update">;

function getJwtSecret(): string {
  const secret = Bun.env.JWT_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

function isRole(value: string): value is Role {
  return (VALID_ROLES as readonly string[]).includes(value);
}

const rolePriorityOrder = sql<number>`
  CASE ${roles.name}
    WHEN 'Admin' THEN 1
    WHEN 'Organizer' THEN 2
    WHEN 'Judge' THEN 3
    WHEN 'Participant' THEN 4
    ELSE 5
  END
`;

async function createAccessToken(id: string, role: Role): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      id,
      role,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SECONDS,
    },
    getJwtSecret(),
  );
}

async function issueTokens(
  userId: string,
  role: Role,
  executor: DbExecutor = db,
) {
  const accessToken = await createAccessToken(userId, role);
  const refreshToken = createRefreshToken();

  await executor.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: sql`NOW() + (${REFRESH_TOKEN_TTL_DAYS} * INTERVAL '1 day')`,
  });

  return { accessToken, refreshToken };
}

async function getPrimaryRole(
  userId: string,
  executor: DbExecutor = db,
): Promise<Role | null> {
  const [row] = await executor
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId))
    .orderBy(rolePriorityOrder)
    .limit(1);

  if (!row || !isRole(row.name)) return null;
  return row.name;
}

async function getUserWithPrimaryRole(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: roles.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(users.id, userId))
    .orderBy(rolePriorityOrder)
    .limit(1);

  return user ?? null;
}

export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  const { fullName, email, password } = input;

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(sql`LOWER(${users.email})`, email))
      .limit(1);

    if (existing) {
      throw AppError.conflict("Email is already registered");
    }

    const [participantRole] = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, "Participant"))
      .limit(1);

    if (!participantRole) {
      console.error("Participant role is missing from the database");
      throw new AppError("Registration is temporarily unavailable", 500);
    }

    const passwordHash = await Bun.password.hash(password);

    const [createdUser] = await tx
      .insert(users)
      .values({
        fullName,
        email,
        passwordHash,
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        createdAt: users.createdAt,
      });

    await tx.insert(userRoles).values({
      userId: createdUser.id,
      roleId: participantRole.id,
    });

    const tokens = await issueTokens(createdUser.id, "Participant", tx);

    return {
      user: {
        id: createdUser.id,
        fullName: createdUser.fullName,
        email: createdUser.email,
        role: "Participant" as Role,
        createdAt: createdUser.createdAt,
      },
      ...tokens,
    };
  });
}

export async function loginUser(input: { email: string; password: string }) {
  const { email, password } = input;

  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
      role: roles.name,
    })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(sql`LOWER(${users.email})`, email))
    .orderBy(rolePriorityOrder)
    .limit(1);

  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    throw AppError.forbidden("Account is inactive");
  }

  const passwordMatches = await Bun.password.verify(password, user.passwordHash);
  if (!passwordMatches) {
    throw AppError.unauthorized("Invalid email or password");
  }

  if (!isRole(user.role)) {
    throw AppError.forbidden("Invalid user role");
  }

  const tokens = await issueTokens(user.id, user.role);

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
}

export async function refreshUserTokens(oldToken: string) {
  return db.transaction(async (tx) => {
    const [tokenRow] = await tx
      .select({
        id: refreshTokens.id,
        userId: refreshTokens.userId,
        isActive: users.isActive,
      })
      .from(refreshTokens)
      .innerJoin(users, eq(users.id, refreshTokens.userId))
      .where(
        and(
          eq(refreshTokens.tokenHash, hashToken(oldToken)),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, sql`NOW()`),
        ),
      )
      .for("update", { of: refreshTokens })
      .limit(1);

    if (!tokenRow || !tokenRow.isActive) {
      throw AppError.unauthorized("Invalid or expired refresh token");
    }

    const role = await getPrimaryRole(tokenRow.userId, tx);
    if (!role) {
      throw AppError.forbidden("User role not found or invalid");
    }

    await tx
      .update(refreshTokens)
      .set({ revokedAt: sql`NOW()` })
      .where(eq(refreshTokens.id, tokenRow.id));

    return issueTokens(tokenRow.userId, role, tx);
  });
}

export async function logoutUser(refreshToken: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: sql`NOW()` })
    .where(
      and(
        eq(refreshTokens.tokenHash, hashToken(refreshToken)),
        isNull(refreshTokens.revokedAt),
      ),
    );
}

export async function getCurrentUser(userId: string) {
  const user = await getUserWithPrimaryRole(userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }
  return user;
}

export async function getUserPortfolio(userId: string) {
  const user = await getUserWithPrimaryRole(userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }

  const [statsRow] = await db
    .select({
      totalSubmissions: sql<number>`COUNT(*)::int`,
      approvedWorks: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'APPROVED')::int`,
    })
    .from(submissions)
    .where(eq(submissions.participantId, userId));

  const totalSubmissions = statsRow?.totalSubmissions ?? 0;
  const approvedWorks = statsRow?.approvedWorks ?? 0;

  const awardRows = await db
    .select({
      submissionId: submissions.id,
      submissionTitle: submissions.title,
      photoUrl: sql<string | null>`COALESCE(${submissions.imagePreviewPath}, ${submissions.imageOriginalPath})`,
      awardedAt: submissions.createdAt,
      contestId: contests.id,
      contestName: contests.name,
      contestStatus: contests.status,
      filmBrand: filmMetadata.filmBrand,
      filmStock: filmMetadata.filmStock,
      filmFormat: filmMetadata.filmFormat,
      camera: filmMetadata.cameraBody,
      lens: filmMetadata.lens,
      devLab: filmMetadata.devLabName,
    })
    .from(submissions)
    .innerJoin(contests, eq(contests.id, submissions.contestId))
    .leftJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.participantId, userId),
        eq(submissions.status, "APPROVED"),
        inArray(sql`LOWER(${contests.status})`, [
          "published",
          "completed",
          "archived",
        ]),
        eq(contests.isDeleted, false),
      ),
    )
    .orderBy(desc(submissions.createdAt));

  const awards = awardRows.map((row, idx) => {
    const template = AWARD_TEMPLATES[idx % AWARD_TEMPLATES.length];
    return {
      id: `award-${row.submissionId}`,
      contestId: row.contestId,
      contestName: row.contestName,
      award: template.award,
      awardRank: template.awardRank,
      awardTitle: template.awardTitle,
      submissionId: row.submissionId,
      submissionTitle: row.submissionTitle,
      photoUrl:
        row.photoUrl ||
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
      finalScore: template.finalScore,
      filmStock:
        row.filmStock ||
        (row.filmBrand ? `${row.filmBrand} Film` : "Kodak Portra 400"),
      camera: row.camera || "Leica M6",
      lens: row.lens || "35mm f/2",
      filmFormat: row.filmFormat || "135",
      developmentLab: row.devLab || "LLab Saigon",
      juryCritique: template.juryCritique,
      awardedAt: row.awardedAt,
    };
  });

  const workRows = await db
    .select({
      id: submissions.id,
      title: submissions.title,
      photoUrl: sql<string | null>`COALESCE(${submissions.imagePreviewPath}, ${submissions.imageOriginalPath})`,
      status: submissions.status,
      contestName: contests.name,
      filmStock: filmMetadata.filmStock,
      camera: filmMetadata.cameraBody,
      lens: filmMetadata.lens,
      filmFormat: filmMetadata.filmFormat,
    })
    .from(submissions)
    .leftJoin(contests, eq(contests.id, submissions.contestId))
    .leftJoin(filmMetadata, eq(filmMetadata.submissionId, submissions.id))
    .where(eq(submissions.participantId, userId))
    .orderBy(desc(submissions.createdAt))
    .limit(12);

  const curatedWorks = workRows.map((row) => ({
    id: row.id,
    title: row.title,
    photoUrl:
      row.photoUrl ||
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    contestName: row.contestName,
    filmStock: row.filmStock,
    camera: row.camera,
    lens: row.lens,
    filmFormat: row.filmFormat,
    status: row.status,
  }));

  return {
    user,
    stats: {
      totalSubmissions,
      approvedWorks,
      awardsCount: awards.length,
    },
    awards,
    curatedWorks,
  };
}
