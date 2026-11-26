import { inArray, sql } from "drizzle-orm";
import sharp from "sharp";
import { uploadToR2 } from "../r2";
import { db } from "./index";
import {
  categories,
  contestJudges,
  contestPublications,
  contests,
  evaluations,
  evaluationScores,
  filmMetadata,
  judgingRounds,
  roles,
  scoringCriteria,
  submissions,
  userRoles,
  users,
  type OfficialResultEntry,
} from "./schema";

const schedule = {
  registrationStart: "2026-12-01T09:00:00+07:00",
  submissionDeadline: "2026-12-05T18:00:00+07:00",
  judgingStart: "2026-12-06T09:00:00+07:00",
  judgingEnd: "2026-12-07T18:00:00+07:00",
  resultPublication: "2026-12-08T09:00:00+07:00",
};

const aliases = ["O1", "O2", "P1", "P2", "J1", "J2", "A", "C1", "C2", "K1", "K2", "K3", "S1", "S2", "R1", "CRIT1", "CRIT2"] as const;
type Alias = (typeof aliases)[number];

// Stable IDs also keep local storage keys stable across repeated runs.
const ids = Object.fromEntries(aliases.map((alias, index) => [
  alias, `accede00-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
])) as Record<Alias, string>;

const accounts = [
  ["O1", "Organizer"], ["O2", "Organizer"],
  ["P1", "Participant"], ["P2", "Participant"],
  ["J1", "Judge"], ["J2", "Judge"], ["A", "Admin"],
] as const;

const contestFixtures = [["C1", "O1"], ["C2", "O2"]] as const;
const categoryFixtures = [["K1", "C1"], ["K2", "C1"], ["K3", "C2"]] as const;
const submissionFixtures = [
  ["S1", "P1", "K1", "VERIFIED", "#346d85"],
  ["S2", "P2", "K2", "VERIFIED", "#95643c"],
] as const;

// Final-round sheets for C1: J1 = 9/8 and J2 = 9/7 on weights 0.6/0.4, so S1 averages (8.60 + 8.20) / 2 = 8.50.
const finalRoundSheets = [
  ["J1", 9, 8, "J1: ánh sáng và hạt phim tốt, bố cục chắc."],
  ["J2", 9, 7, "J2: khung hình đẹp, vùng sáng hơi dày."],
] as const;

const publishedEntry: OfficialResultEntry = {
  submissionId: ids.S1,
  categoryId: ids.K1,
  categoryName: "Acceptance · K1",
  rank: 1,
  finalScore: 8.5,
  award: "GOLD",
  awardRank: 1,
  awardTitle: "Giải Nhất",
  prizeValueVnd: 10_000_000,
  title: "Acceptance · S1",
  authorName: "Acceptance P1",
  photoUrl: null,
  isProofVerified: true,
  isResultsLocked: true,
};

export async function seedAcceptance() {
  if (["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"]
    .some((key) => Bun.env[key]?.trim())) {
    throw new Error("Clear R2 configuration for the acceptance seed to use local test storage.");
  }

  const password = "password123";
  const passwordHash = await Bun.password.hash(password);
  // S1 also gets a verified negative proof so it can enter the published archive (BR-06/17).
  const proofs = await Promise.all(submissionFixtures.map(([alias, participant]) => renderJpeg(600, 400, "#1f1f1f", `${alias}-proof`).then((image) => ({
    key: `proofs/${ids[participant]}/${ids[alias]}.jpg`,
    image,
  }))));
  const entries = await Promise.all(submissionFixtures.map(async ([alias, participant, category, status, background]) => {
    const image = await renderJpeg(3000, 2000, background, alias);
    const key = `submissions/${ids[participant]}/${ids[alias]}.jpg`;

    return {
      key,
      file: new File([new Uint8Array(image)], `${alias}.jpg`, { type: "image/jpeg" }),
      submission: {
        id: ids[alias],
        contestId: ids.C1,
        categoryId: ids[category],
        participantId: ids[participant],
        title: `Acceptance · ${alias}`,
        imageOriginalPath: key,
        negativeProofPath: alias === "S1" ? `proofs/${ids[participant]}/${ids[alias]}.jpg` : null,
        proofType: alias === "S1" ? ("negative" as const) : null,
        proofRequestedAt: alias === "S1" ? new Date(schedule.submissionDeadline) : null,
        proofVerifiedAt: alias === "S1" ? new Date(schedule.judgingStart) : null,
        proofVerifiedBy: alias === "S1" ? ids.O1 : null,
        fileSizeBytes: BigInt(image.length),
        width: 3000,
        height: 2000,
        status,
      },
      metadata: {
        submissionId: ids[alias],
        filmBrand: "Kodak",
        filmStock: "Portra 400",
        filmFormat: "135",
        isoRated: 400,
        isoShot: 400,
        cameraBody: "Nikon FM2",
        lens: "50mm f/1.8",
        rollId: `ACCEPTANCE-${participant}`,
        frameNumber: "1",
        devLabName: "Lab test",
        scannerModel: "Noritsu",
      },
    };
  }));

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('cinegen:seed:acceptance'))`);
    await tx.insert(roles).values(
      [...new Set(accounts.map(([, role]) => role))].map((name) => ({ name })),
    ).onConflictDoNothing({ target: roles.name });
    const roleIds = new Map((await tx.select().from(roles)).map(({ name, id }) => [name, id]));
    await tx.insert(users).values(accounts.map(([alias]) => ({
      id: ids[alias],
      fullName: `Acceptance ${alias}`,
      email: `acceptance.${alias.toLowerCase()}@example.com`,
      passwordHash,
      emailVerifiedAt: new Date(),
    }))).onConflictDoNothing({ target: users.id });
    await tx.insert(userRoles).values(accounts.map(([alias, role]) => {
      const roleId = roleIds.get(role);
      if (!roleId) throw new Error(`Missing acceptance role: ${role}`);
      return { userId: ids[alias], roleId };
    })).onConflictDoNothing();

    await tx.insert(contests).values(contestFixtures.map(([alias, owner]) => ({
      id: ids[alias],
      name: `Acceptance · ${alias}`,
      createdBy: ids[owner],
      status: alias === "C1" ? "RESULTS_PUBLISHED" : "OPEN",
      startAt: new Date(schedule.registrationStart),
      endAt: new Date(schedule.submissionDeadline),
      judgingStartAt: new Date(schedule.judgingStart),
      judgingDeadlineAt: new Date(schedule.judgingEnd),
      publishedAt: new Date(schedule.resultPublication),
    }))).onConflictDoNothing({ target: contests.id });
    await tx.insert(categories).values(categoryFixtures.map(([alias, contest]) => ({
      id: ids[alias],
      contestId: ids[contest],
      name: `Acceptance · ${alias}`,
    }))).onConflictDoNothing({ target: categories.id });
    await tx.insert(scoringCriteria).values(categoryFixtures.map(([alias]) => ({
      categoryId: ids[alias],
      name: "Chất lượng tác phẩm",
      weight: "1.0000",
    }))).onConflictDoNothing();
    await tx.insert(contestJudges).values([
      { contestId: ids.C1, categoryId: ids.K1, judgeId: ids.J1, assignedBy: ids.O1 },
      { contestId: ids.C1, categoryId: ids.K1, judgeId: ids.J2, assignedBy: ids.O1 },
      { contestId: ids.C1, categoryId: ids.K2, judgeId: ids.J2, assignedBy: ids.O1 },
      { contestId: ids.C2, categoryId: ids.K3, judgeId: ids.J1, assignedBy: ids.O2 },
    ]).onConflictDoNothing();

    // M08: C1 already ran and closed its final round, so results and feedback can be reviewed (UC-26/27/41).
    await tx.insert(judgingRounds).values({
      id: ids.R1,
      contestId: ids.C1,
      name: "Acceptance · Vòng chung kết",
      position: 1,
      startAt: new Date(schedule.judgingStart),
      deadlineAt: new Date(schedule.judgingEnd),
      advanceCount: null,
      requiredJudges: 2,
      startedAt: new Date(schedule.judgingStart),
      lockedAt: new Date(schedule.judgingEnd),
    }).onConflictDoNothing({ target: judgingRounds.id });
    await tx.insert(scoringCriteria).values([
      { id: ids.CRIT1, categoryId: ids.K1, name: "Sáng tạo", maxScore: "10.00", weight: "0.6000", sortOrder: 1 },
      { id: ids.CRIT2, categoryId: ids.K1, name: "Kỹ thuật", maxScore: "10.00", weight: "0.4000", sortOrder: 2 },
    ]).onConflictDoNothing({ target: scoringCriteria.id });

    for (const { file, key } of entries) {
      if (!(await Bun.file(`uploads/${key}`).exists())) await uploadToR2(file, key);
    }
    for (const { key, image } of proofs) {
      if (!(await Bun.file(`uploads/${key}`).exists())) {
        await uploadToR2(new File([new Uint8Array(image)], "proof.jpg", { type: "image/jpeg" }), key);
      }
    }
    await tx.insert(submissions).values(entries.map(({ submission }) => submission))
      .onConflictDoNothing({ target: submissions.id });
    await tx.insert(filmMetadata).values(entries.map(({ metadata }) => metadata))
      .onConflictDoNothing({ target: filmMetadata.submissionId });
    const submissionsInC1 = [ids.S1, ids.S2];
    const existingSheets = await tx.select({ id: evaluations.id }).from(evaluations)
      .where(inArray(evaluations.submissionId, submissionsInC1)).limit(1);
    if (existingSheets.length === 0) {
      for (const [judge, creativity, technique, comment] of finalRoundSheets) {
        const [sheet] = await tx.insert(evaluations).values({
          submissionId: ids.S1,
          judgeId: ids[judge],
          roundId: ids.R1,
          comment,
        }).returning({ id: evaluations.id });
        await tx.insert(evaluationScores).values([
          { evaluationId: sheet.id, criterionId: ids.CRIT1, score: String(creativity) },
          { evaluationId: sheet.id, criterionId: ids.CRIT2, score: String(technique) },
        ]);
      }
      await tx.insert(contestPublications).values({
        contestId: ids.C1,
        roundId: ids.R1,
        contestName: "Acceptance · C1",
        publishedBy: ids.O1,
        publishedAt: new Date(schedule.resultPublication),
        tieBreaks: [],
        entries: [publishedEntry],
      }).onConflictDoNothing({ target: contestPublications.contestId });
    }
  });

  for (const [alias, role] of accounts) {
    console.log(`[Seed nghiệm thu] ${role}: acceptance.${alias.toLowerCase()}@example.com`);
  }
  console.log(`[Seed nghiệm thu] Dữ liệu mẫu: ${contestFixtures.length} cuộc thi.`);
  console.log(`[Seed nghiệm thu] C1 đã công bố; S1 = 8.50 (Giải Nhất), có nhận xét của J1/J2 và proof đã xác minh.`);
  console.log(`[Seed nghiệm thu] Mật khẩu mặc định: ${password}.`);
}

function renderJpeg(width: number, height: number, background: string, label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="${background}"/>
    <text x="50%" y="50%" fill="#f8fafc" font-family="sans-serif" font-size="${Math.round(width / 12)}"
      text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}
