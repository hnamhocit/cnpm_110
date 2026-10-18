import { describe, expect, test } from "bun:test";
import { filterContests, formatContestDate } from "@/lib/contest-utils";
import type { Contest } from "@/types/contest";

const mockContests: Contest[] = [
  {
    id: "1",
    name: "Cuộc thi Ảnh Phim Đen Trắng",
    description: "Dành riêng cho phim B&W",
    start_at: "2026-10-01T00:00:00Z",
    end_at: "2026-11-30T00:00:00Z",
    status: "ongoing",
    category: "B&W",
  },
  {
    id: "2",
    name: "Khoảnh khắc Mùa Hè 35mm",
    description: "Ảnh phim màu đường phố",
    start_at: "2026-10-10T00:00:00Z",
    end_at: "2026-12-10T00:00:00Z",
    status: "ongoing",
    category: "Color 35mm",
  },
  {
    id: "3",
    name: "Phong cảnh Mùa Đông Medium Format",
    description: "Sắp diễn ra vào tháng 12",
    start_at: "2026-12-01T00:00:00Z",
    end_at: "2027-01-15T00:00:00Z",
    status: "published",
    category: "120 Film",
  },
];

describe("FPC-37 Contest Utils", () => {
  test("filterContests by status 'ongoing'", () => {
    const results = filterContests(mockContests, "", "ongoing");
    expect(results.length).toBe(2);
    expect(results.every((c) => c.status === "ongoing")).toBe(true);
  });

  test("filterContests by status 'published'", () => {
    const results = filterContests(mockContests, "", "published");
    expect(results.length).toBe(1);
    expect(results[0]?.id).toBe("3");
  });

  test("filterContests by search query matches name", () => {
    const results = filterContests(mockContests, "Đen Trắng", "all");
    expect(results.length).toBe(1);
    expect(results[0]?.name).toContain("Đen Trắng");
  });

  test("filterContests by search query matches category", () => {
    const results = filterContests(mockContests, "120 Film", "all");
    expect(results.length).toBe(1);
    expect(results[0]?.name).toContain("Phong cảnh Mùa Đông");
  });

  test("filterContests returns empty when no match", () => {
    const results = filterContests(mockContests, "không tồn tại xyz", "all");
    expect(results.length).toBe(0);
  });

  test("formatContestDate formats valid ISO date to DD/MM/YYYY", () => {
    const formatted = formatContestDate("2026-10-01T00:00:00Z");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("10");
  });
});
