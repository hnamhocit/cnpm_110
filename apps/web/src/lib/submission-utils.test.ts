import { describe, expect, test } from "bun:test";
import { filterSubmissions } from "@/lib/submission-utils";
import type { Submission } from "@/types/submission";

const mockSubmissions: Submission[] = [
  {
    id: "SUB-001",
    participantId: "PART-001",
    authorName: "Nguyễn Văn An",
    title: "Ánh sáng cuối ngày",
    submittedAt: "2026-10-20T08:30:00Z",
    isAiFlagged: false,
    status: "PENDING_AI",
  },
  {
    id: "SUB-002",
    participantId: "PART-002",
    authorName: "Trần Thị Bình",
    title: "Phố cổ Hà Nội",
    submittedAt: "2026-10-21T14:15:00Z",
    isAiFlagged: true,
    status: "FLAGGED",
  },
  {
    id: "SUB-003",
    participantId: "PART-003",
    authorName: "Nhóm Film 35mm",
    title: "Đường về nhà",
    submittedAt: "2026-10-22T18:00:00Z",
    isAiFlagged: false,
    status: "APPROVED",
  },
];

describe("FPC-56 filterSubmissions", () => {
  test("trả về toàn bộ danh sách khi từ khoá rỗng", () => {
    expect(filterSubmissions(mockSubmissions, "   ")).toHaveLength(3);
  });

  test("lọc theo tên thí sinh, không phân biệt hoa thường", () => {
    const results = filterSubmissions(mockSubmissions, "trần thị");
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("SUB-002");
  });

  test("trả về mảng rỗng khi không khớp", () => {
    expect(filterSubmissions(mockSubmissions, "không tồn tại")).toHaveLength(0);
  });
});
