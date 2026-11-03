
import { describe, expect, test } from "bun:test";
import sharp from "sharp";

import {
  calculatePHash,
  hammingDistance,
  isDuplicate,
  findClosestDuplicate,
} from "../src/services/duplicate-detection";

describe("FPC-53: Duplicate Detection", () => {
  test("Hai mã hash giống nhau có khoảng cách bằng 0", () => {
    const hash = "abcdef1234567890";

    expect(hammingDistance(hash, hash)).toBe(0);
  });

  test("Hai mã hash khác nhau 1 bit", () => {
    expect(
      hammingDistance(
        "0000000000000000",
        "0000000000000001",
      ),
    ).toBe(1);
  });

  test("Phát hiện hash nghi ngờ trùng", () => {
    expect(
      isDuplicate(
        "0000000000000000",
        "0000000000000003",
      ),
    ).toBe(true);
  });

  test("Không đánh dấu hash khác nhau nhiều", () => {
    expect(
      isDuplicate(
        "0000000000000000",
        "ffffffffffffffff",
      ),
    ).toBe(false);
  });

  test("Tính pHash cho ảnh hợp lệ", async () => {
    const image = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: "#336699",
      },
    })
      .png()
      .toBuffer();

    const hash = await calculatePHash(image);

    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  test("Cùng một ảnh tạo ra cùng pHash", async () => {
    const image = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: "#ff0000",
      },
    })
      .png()
      .toBuffer();

    const hash1 = await calculatePHash(image);
    const hash2 = await calculatePHash(image);

    expect(hash1).toBe(hash2);
  });

  test("Từ chối hash không hợp lệ", () => {
    expect(() =>
      hammingDistance("invalid", "0000000000000000"),
    ).toThrow();
  });

  test("Tìm được ảnh trùng gần nhất", () => {
    const result = findClosestDuplicate(
      "0000000000000000",
      [
        {
          submissionId: "image-1",
          phashHex: "0000000000000007",
        },
        {
          submissionId: "image-2",
          phashHex: "0000000000000001",
        },
        {
          submissionId: "image-3",
          phashHex: "ffffffffffffffff",
        },
      ],
    );

    expect(result?.submissionId).toBe("image-2");
    expect(result?.hammingDistance).toBe(1);
    expect(result?.similarityScore).toBe(63 / 64);
  });

  test("Không tìm thấy ảnh trùng", () => {
    const result = findClosestDuplicate(
      "0000000000000000",
      [
        {
          submissionId: "image-1",
          phashHex: "ffffffffffffffff",
        },
      ],
    );

    expect(result).toBeNull();
  });

  test("Danh sách ảnh rỗng trả về null", () => {
    const result = findClosestDuplicate(
      "0000000000000000",
      [],
    );

    expect(result).toBeNull();
  });
});
