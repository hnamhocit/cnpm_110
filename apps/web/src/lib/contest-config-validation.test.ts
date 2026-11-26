import { describe, expect, test } from "bun:test";
import {
  MSG007_INVALID_TOTAL,
  MSG008_INVALID_TIMELINE,
  validateContestConfig,
  validateContestUpdateInput,
} from "@/lib/contest-config-validation";
import type { ContestConfigInput } from "@/types/contest-config";
import { fromPercent } from "@/types/contest-config";

function makeInput(): ContestConfigInput {
  return {
    name: "Hương Sắc Phim Màu 2026",
    slug: "huong-sac-phim-mau-2026",
    theme: "Vẻ đẹp Sắc độ Analog",
    rules: "Ảnh chụp bằng máy phim 135 hoặc 120.",
    coverImageUrl: "",
    registrationStartAt: "2026-11-10T00:00",
    submissionDeadlineAt: "2026-12-10T23:59",
    judgingStartAt: "2026-12-12T00:00",
    judgingDeadlineAt: "2026-12-25T23:59",
    publishedAt: "2026-12-30T10:00",
    maxEntriesPerUser: 5,
    categories: [
      {
        code: "CAT-COLOR-135",
        name: "Màu sắc Đường phố 35mm",
        formatRestriction: "135",
        maxEntriesPerParticipant: 3,
        requireNegativeProofUpfront: false,
        criteria: [
          {
            code: "COMP",
            name: "Bố cục & Khoảnh khắc",
            weight: fromPercent(40),
          },
          { code: "TONE", name: "Màu sắc & Hạt phim", weight: fromPercent(35) },
          {
            code: "STORY",
            name: "Thông điệp tác phẩm",
            weight: fromPercent(25),
          },
        ],
      },
    ],
    awards: [
      {
        code: "FIRST_PRIZE",
        name: "Giải Nhất Chung Cuộc",
        rankOrder: 1,
        prizeValueVnd: 20_000_000,
        quota: 1,
      },
    ],
    status: "DRAFT",
  };
}

function codesOf(errors: Record<string, { code: string }>): string[] {
  return Object.values(errors).map((error) => error.code);
}

describe("validateContestConfig", () => {
  test("accepts a valid five-milestone config with 40/35/25 weights", () => {
    expect(validateContestConfig(makeInput())).toEqual({});
  });

  test("rejects a broken timeline order with MSG008", () => {
    const input = makeInput();
    input.judgingStartAt = "2026-12-01T00:00";
    const errors = validateContestConfig(input);

    expect(errors.submissionDeadlineAt?.code).toBe("MSG008");
    expect(errors.submissionDeadlineAt?.message).toBe(MSG008_INVALID_TIMELINE);
    expect(codesOf(errors)).toContain("MSG008");
  });

  test("rejects publication before judging closes with MSG008", () => {
    const input = makeInput();
    input.publishedAt = "2026-12-20T00:00";
    const errors = validateContestConfig(input);

    expect(errors.judgingStartAt?.code).toBe("MSG008");
  });

  test("rejects 24% total with MSG007 and current weight", () => {
    const input = makeInput();
    const criteria = input.categories[0].criteria;
    if (criteria) {
      criteria[0].weight = fromPercent(24);
      criteria[1].weight = fromPercent(0);
      criteria[2].weight = fromPercent(0);
    }
    const errors = validateContestConfig(input);

    expect(errors["categories.0.criteria"]?.code).toBe("MSG007");
    expect(errors["categories.0.criteria"]?.message).toBe(
      MSG007_INVALID_TOTAL(24),
    );
  });

  test("rejects negative and over-100% individual weights", () => {
    const input = makeInput();
    const criteria = input.categories[0].criteria;
    if (criteria) {
      criteria[0].weight = -0.1;
      criteria[1].weight = 1.2;
    }
    const errors = validateContestConfig(input);

    expect(codesOf(errors)).toContain("INVALID_WEIGHT");
    expect(errors["categories.0.criteria.0.weight"]).toBeDefined();
    expect(errors["categories.0.criteria.1.weight"]).toBeDefined();
  });

  test("rejects an empty category list", () => {
    const input = makeInput();
    input.categories = [];
    const errors = validateContestConfig(input);

    expect(errors.categories?.code).toBe("MSG002");
  });

  test("rejects a short contest name", () => {
    const input = makeInput();
    input.name = "Abc";
    const errors = validateContestConfig(input);

    expect(errors.name?.code).toBe("MSG002");
  });

  test("rejects negative award value and invalid quota", () => {
    const input = makeInput();
    input.awards[0].prizeValueVnd = -1;
    input.awards[0].quota = 0;
    const errors = validateContestConfig(input);

    expect(errors["awards.0.prizeValueVnd"]?.code).toBe("INVALID_RANGE");
    expect(errors["awards.0.quota"]?.code).toBe("INVALID_RANGE");
  });
});

describe("validateContestUpdateInput", () => {
  test("accepts valid edit input with only start/end milestones", () => {
    const input = makeInput();
    input.submissionDeadlineAt = "";
    input.judgingStartAt = "";
    input.judgingDeadlineAt = "";

    expect(validateContestUpdateInput(input)).toEqual({});
  });

  test("rejects publishedAt <= registrationStartAt with MSG008", () => {
    const input = makeInput();
    input.publishedAt = "2026-11-01T00:00";
    const errors = validateContestUpdateInput(input);

    expect(errors.publishedAt?.code).toBe("MSG008");
    expect(errors.publishedAt?.message).toBe(MSG008_INVALID_TIMELINE);
  });

  test("rejects missing theme with MSG002", () => {
    const input = makeInput();
    input.theme = "  ";
    const errors = validateContestUpdateInput(input);

    expect(errors.theme?.code).toBe("MSG002");
  });
});
