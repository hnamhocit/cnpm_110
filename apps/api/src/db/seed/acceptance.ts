import { env } from "../../config/env";
import { eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { uploadToR2 } from "../../r2";
import { db } from "../index";
import {
  categories,
  contestJudges,
  contestPublications,
  contests,
  evaluations,
  evaluationScores,
  filmMetadata,
  filmRolls,
  judgingRoundEntries,
  judgingRounds,
  roles,
  scoringCriteria,
  submissions,
  userRoles,
  users,
  exhibitionImages,
} from "../schema";

// Keep the original aliases stable. Add new aliases at the end only.
const aliases = [
  "O1",
  "O2",
  "P1",
  "P2",
  "J1",
  "J2",
  "A",
  "C1",
  "C2",
  "K1",
  "K2",
  "K3",
  "S1",
  "S2",
  "R1",
  "CRIT1",
  "CRIT2",
  "C3",
  "K4",
  "S3",
  "S4",
  "R2",
  "CRIT3",
  "CRIT4",
  "CRIT5",
  "CRIT6",
  "ROLL1",
  "ROLL2",
] as const;
type Alias = (typeof aliases)[number];
export const acceptanceIds = Object.fromEntries(
  aliases.map((alias, index) => [
    alias,
    `accede00-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  ]),
) as Record<Alias, string>;
const ids = acceptanceIds;
const accounts = [
  ["O1", "Organizer"],
  ["O2", "Organizer"],
  ["P1", "Participant"],
  ["P2", "Participant"],
  ["J1", "Judge"],
  ["J2", "Judge"],
  ["A", "Admin"],
] as const;
const sections = [
  ["K1", "C1"],
  ["K2", "C1"],
  ["K3", "C2"],
  ["K4", "C3"],
] as const;
const works = [
  ["S1", "P1", "K1", "C1", "ROLL1", "1"],
  ["S2", "P2", "K2", "C1", "ROLL2", "1"],
  ["S3", "P1", "K4", "C3", "ROLL1", "2"],
  ["S4", "P2", "K4", "C3", "ROLL2", "2"],
] as const;
const criteria = [
  ["CRIT1", "K1", "Light"],
  ["CRIT2", "K1", "Frame"],
  ["CRIT3", "K2", "Light"],
  ["CRIT4", "K2", "Frame"],
  ["CRIT5", "K4", "Light"],
  ["CRIT6", "K4", "Frame"],
] as const;
const awards = [
  {
    code: "GOLD",
    name: "Giải Nhất",
    rankOrder: 1,
    quota: 1,
    prizeValueVnd: 10_000_000,
  },
  {
    code: "SILVER",
    name: "Giải Nhì",
    rankOrder: 2,
    quota: 1,
    prizeValueVnd: 5_000_000,
  },
];

function schedule(anchor: Date) {
  const day = 86400000;
  return {
    startAt: new Date(+anchor - 10 * day),
    endAt: new Date(+anchor - 9 * day),
    judgingStartAt: new Date(+anchor - 8 * day),
    judgingDeadlineAt: new Date(+anchor - 2 * day),
    publishedAt: new Date(+anchor - day),
  };
}

export function assertAcceptanceEnvironment() {
  const url = new URL(env.databaseUrl);
  if (
    env.nodeEnv === "production" ||
    !url ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !/^\/cinegen_acceptance_(?:test|verify(?:_[a-z0-9]+)?)$/.test(url.pathname)
  ) {
    throw new Error(
      "Acceptance seed requires a local cinegen_acceptance_test or cinegen_acceptance_verify_* database",
    );
  }
  if (
    [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    ].some((key) => Bun.env[key]?.trim())
  ) {
    throw new Error("Clear R2 configuration for local acceptance storage");
  }
}

export async function seedAcceptance() {
  assertAcceptanceEnvironment();
  const storagePrefix = `acceptance/${new URL(env.databaseUrl).pathname.slice(1)}/`;
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('cinegen:seed:acceptance'))`,
    );
    const existing = await tx
      .select({ id: contests.id })
      .from(contests)
      .where(eq(contests.id, ids.C1));
    if (existing.length) {
      const version = await tx
        .select()
        .from(contests)
        .where(eq(contests.id, ids.C3));
      if (!version.length)
        throw new Error(
          "Legacy acceptance fixtures detected. Preserve that database and seed a separate clean cinegen_acceptance_verify_* database.",
        );
      console.log(
        "[Seed] Fixtures already exist; preserving current test state.",
      );
      return;
    }
    const anchor = new Date();
    const closed = schedule(anchor);
    const open = schedule(new Date(+anchor + 9.5 * 86400000));
    const hash = await Bun.password.hash("password123");
    await tx
      .insert(roles)
      .values(
        [...new Set(accounts.map(([, name]) => name))].map((name) => ({
          name,
        })),
      )
      .onConflictDoNothing({ target: roles.name });
    const roleIds = new Map(
      (await tx.select().from(roles)).map((row) => [row.name, row.id]),
    );
    await tx.insert(users).values(
      accounts.map(([alias]) => ({
        id: ids[alias],
        fullName: `Acceptance ${alias}`,
        email: `acceptance.${alias.toLowerCase()}@example.com`,
        passwordHash: hash,
        emailVerifiedAt: anchor,
      })),
    );
    await tx.insert(userRoles).values(
      accounts.map(([alias, role]) => ({
        userId: ids[alias],
        roleId: roleIds.get(role)!,
      })),
    );
    await tx.insert(contests).values([
      {
        id: ids.C1,
        name: "Acceptance · C1",
        createdBy: ids.O1,
        status: "judging",
        awards,
        ...closed,
      },
      {
        id: ids.C2,
        name: "Acceptance · C2",
        createdBy: ids.O2,
        status: "OPEN",
        awards,
        ...open,
      },
      {
        id: ids.C3,
        name: "Acceptance · C3 before publication",
        createdBy: ids.O1,
        status: "judging",
        awards,
        ...closed,
      },
    ]);
    await tx.insert(categories).values(
      sections.map(([alias, contest]) => ({
        id: ids[alias],
        contestId: ids[contest],
        name: `Acceptance · ${alias}`,
        requireNegativeProof: true,
      })),
    );
    await tx.insert(scoringCriteria).values(
      criteria.map(([alias, category, name], index) => ({
        id: ids[alias],
        categoryId: ids[category],
        name,
        maxScore: "10.00",
        weight: "0.5000",
        sortOrder: index % 2,
      })),
    );
    await tx
      .insert(scoringCriteria)
      .values({ categoryId: ids.K3, name: "Quality", weight: "1.0000" });
    await tx.insert(filmRolls).values(
      [
        ["ROLL1", "P1"],
        ["ROLL2", "P2"],
      ].map(([roll, owner]) => ({
        id: ids[roll as Alias],
        userId: ids[owner as Alias],
        filmStock: "Kodak Portra 400",
        iso: 400,
        format: "135",
      })),
    );
    await tx.insert(judgingRounds).values(
      [
        ["R1", "C1"],
        ["R2", "C3"],
      ].map(([round, contest]) => ({
        id: ids[round as Alias],
        contestId: ids[contest as Alias],
        name: "Final",
        position: 1,
        advanceCount: null,
        requiredJudges: 2,
        startAt: closed.judgingStartAt,
        deadlineAt: closed.judgingDeadlineAt,
        startedAt: closed.judgingStartAt,
        lockedAt: closed.judgingDeadlineAt,
      })),
    );
    for (const [work, participant, category, contest, roll, frame] of works) {
      const image = await jpeg(
        3000,
        2000,
        work === "S1" || work === "S3" ? "#346d85" : "#95643c",
      );
      const original = `${storagePrefix}submissions/${ids[participant]}/${ids[work]}.jpg`;
      const proof = `${storagePrefix}proofs/${ids[participant]}/${ids[work]}.jpg`;
      await uploadToR2(
        new File([new Uint8Array(image)], "scan.jpg", { type: "image/jpeg" }),
        original,
      );
      await uploadToR2(
        new File(
          [new Uint8Array(await jpeg(600, 400, "#222222"))],
          "proof.jpg",
          { type: "image/jpeg" },
        ),
        proof,
      );
      await tx.insert(submissions).values({
        id: ids[work],
        contestId: ids[contest],
        categoryId: ids[category],
        participantId: ids[participant],
        title: `Acceptance · ${work}`,
        imageOriginalPath: original,
        negativeProofPath: proof,
        proofType: "negative",
        proofRequestedAt: closed.endAt,
        proofDeadlineAt: closed.judgingStartAt,
        proofVerifiedAt: closed.judgingStartAt,
        proofVerifiedBy: ids.O1,
        fileSizeBytes: BigInt(image.length),
        width: 3000,
        height: 2000,
        status: "APPROVED",
      });
      await tx.insert(filmMetadata).values({
        submissionId: ids[work],
        filmBrand: "Kodak",
        filmStock: "Portra 400",
        filmFormat: "135",
        isoRated: 400,
        isoShot: 400,
        cameraBody: "Nikon FM2",
        lens: "50mm f/1.8",
        rollId: ids[roll],
        frameNumber: frame,
        devLabName: "Lab test",
        scannerModel: "Noritsu",
      });
      const round = contest === "C1" ? ids.R1 : ids.R2;
      await tx
        .insert(judgingRoundEntries)
        .values({ roundId: round, submissionId: ids[work] });
      const componentScores =
        work === "S1" || work === "S3"
          ? [
              [8, 9],
              [9, 8],
            ]
          : [
              [7, 8],
              [8, 7],
            ];
      const categoryCriteria = criteria.filter(
        ([, section]) => section === category,
      );
      for (const [index, judge] of ["J1", "J2"].entries()) {
        const [sheet] = await tx
          .insert(evaluations)
          .values({
            submissionId: ids[work],
            judgeId: ids[judge as Alias],
            roundId: round,
            comment: `${judge}: ánh sáng và hạt phim tốt.`,
          })
          .returning();
        await tx.insert(evaluationScores).values(
          categoryCriteria.map(([criterion], part) => ({
            evaluationId: sheet.id,
            criterionId: ids[criterion],
            score: String(componentScores[index][part]),
          })),
        );
      }
    }
    for (const [category, contest] of sections.filter(
      ([category]) => category !== "K3",
    )) {
      for (const judge of [ids.J1, ids.J2])
        await tx.insert(contestJudges).values({
          contestId: ids[contest],
          categoryId: ids[category],
          roundId: contest === "C1" ? ids.R1 : ids.R2,
          judgeId: judge,
          assignedBy: ids.O1,
          lockedAt: closed.judgingDeadlineAt,
        });
    }
  });
  // Exercise the real publication/preview services once, rather than inventing a result DTO.
  const publication = await db
    .select()
    .from(contestPublications)
    .where(eq(contestPublications.contestId, ids.C1));
  if (!publication.length) {
    const { publishContestResults } = await import(
      "../../services/contest-publication"
    );
    await publishContestResults(ids.C1, ids.O1, []);
  }
  const preview = await db
    .select({ id: exhibitionImages.id })
    .from(exhibitionImages)
    .where(eq(exhibitionImages.contestId, ids.C1))
    .limit(1);
  if (!preview.length) {
    const { archiveContestWorks } = await import(
      "../../services/exhibition.service"
    );
    await archiveContestWorks(ids.C1, ids.O1, {});
  }
  console.log(
    "[Seed] v2 loaded. See acceptanceIds and the API for current fixture states.",
  );
}

function jpeg(width: number, height: number, background: string) {
  return sharp({ create: { width, height, channels: 3, background } })
    .jpeg({ quality: 90 })
    .toBuffer();
}
