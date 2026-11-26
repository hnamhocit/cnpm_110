import { sql } from "drizzle-orm";
import sharp from "sharp";
import { uploadToR2 } from "../r2";
import { db } from "./index";
import { categories, contestJudges, contests, filmMetadata, roles, scoringCriteria, submissions, userRoles, users } from "./schema";

const schedule = {
  registrationStart: "2026-12-01T09:00:00+07:00",
  submissionDeadline: "2026-12-05T18:00:00+07:00",
  judgingStart: "2026-12-06T09:00:00+07:00",
  judgingEnd: "2026-12-07T18:00:00+07:00",
  resultPublication: "2026-12-08T09:00:00+07:00",
};

const aliases = ["O1", "O2", "P1", "P2", "J1", "J2", "A", "C1", "C2", "K1", "K2", "K3", "S1", "S2"] as const;
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
  ["S1", "P1", "K1", "APPROVED", "#346d85"],
  ["S2", "P2", "K2", "VERIFIED", "#95643c"],
] as const;

export async function seedAcceptance() {
  if (["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"]
    .some((key) => Bun.env[key]?.trim())) {
    throw new Error("Clear R2 configuration for the acceptance seed to use local test storage.");
  }

  const password = "password123";
  const passwordHash = await Bun.password.hash(password);
  const entries = await Promise.all(submissionFixtures.map(async ([alias, participant, category, status, background]) => {
    const image = await sharp({
      create: { width: 3000, height: 2000, channels: 3, background },
    }).jpeg().toBuffer();
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
      status: "ongoing",
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

    for (const { file, key } of entries) {
      if (!(await Bun.file(`uploads/${key}`).exists())) await uploadToR2(file, key);
    }
    await tx.insert(submissions).values(entries.map(({ submission }) => submission))
      .onConflictDoNothing({ target: submissions.id });
    await tx.insert(filmMetadata).values(entries.map(({ metadata }) => metadata))
      .onConflictDoNothing({ target: filmMetadata.submissionId });
  });

  for (const [alias, role] of accounts) {
    console.log(`[Seed nghiệm thu] ${role}: acceptance.${alias.toLowerCase()}@example.com`);
  }
  console.log(`[Seed nghiệm thu] Dữ liệu mẫu: ${contestFixtures.length} cuộc thi.`);
  console.log(`[Seed nghiệm thu] Mật khẩu mặc định: ${password}.`);
}
