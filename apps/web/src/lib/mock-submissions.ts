import type { Submission } from "@/types/submission";

// TODO(FPC-56): thay bằng dữ liệu từ GET /api/v1/submissions khi BE sẵn sàng.
export const mockSubmissions: Submission[] = [
  {
    id: "SUB-001",
    authorName: "Nguyễn Văn An",
    title: "Ánh sáng cuối ngày",
    submittedAt: "2026-10-20T08:30:00Z",
    isAiFlagged: false,
    status: "PENDING_AI",
  },
  {
    id: "SUB-002",
    authorName: "Trần Thị Bình",
    title: "Phố cổ Hà Nội",
    submittedAt: "2026-10-21T14:15:00Z",
    isAiFlagged: true,
    status: "FLAGGED",
  },
  {
    id: "SUB-003",
    authorName: "Lê Minh Cường",
    title: "Mùa mưa Sài Gòn",
    submittedAt: "2026-10-22T09:45:00Z",
    isAiFlagged: false,
    status: "APPROVED",
  },
  {
    id: "SUB-004",
    authorName: "Nhóm Film 35mm",
    title: "Đường về nhà",
    submittedAt: "2026-10-23T18:00:00Z",
    isAiFlagged: true,
    status: "FLAGGED",
  },
  {
    id: "SUB-005",
    authorName: "Phạm Thu Dung",
    title: "Đồi chè Mộc Châu",
    submittedAt: "2026-10-24T11:20:00Z",
    isAiFlagged: false,
    status: "PENDING_AI",
  },
];
