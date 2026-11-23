import type { ScoreboardEntry, ScoreboardSnapshot } from "@/types/scoreboard";

// TODO(Backend): thay bằng GET /api/v1/contests/:contestId/scoreboard
// khi endpoint được chốt trong docs/ai/09-api-contracts.md.
// Mock data tạm thời cho UI testing, xoá khi backend sẵn sàng.
export const MOCK_SCOREBOARD_CONTESTS = [
  {
    id: "fpc-2026-national",
    name: "Cuộc thi Ảnh Phim Toàn Quốc 2026",
  },
  {
    id: "fpc-2026-monochrome",
    name: "Triển lãm Nghệ thuật Đen Trắng 2026",
  },
];

const MOCK_SCOREBOARD_ENTRIES: ScoreboardEntry[] = [
  {
    submissionId: "sub-bw-01",
    submissionCode: "SUB-2026-0015",
    title: "Bóng đổ bên hiên nhà",
    categoryId: "cat-bw",
    categoryName: "Ảnh Đen Trắng",
    judgeCount: 3,
    scoreScale: 30,
    negativeProofVerified: true,
    scores: [
      {
        judgeId: "judge-1",
        judgeName: "Nguyễn Văn Nghệ",
        totalScore: 28,
        submittedAt: "2026-11-18T09:12:00Z",
      },
      {
        judgeId: "judge-2",
        judgeName: "Trần Minh Quân",
        totalScore: 27.5,
        submittedAt: "2026-11-18T10:05:00Z",
      },
      {
        judgeId: "judge-4",
        judgeName: "Đặng Quang Huy",
        totalScore: 28.5,
        submittedAt: "2026-11-18T15:40:00Z",
      },
    ],
  },
  {
    submissionId: "sub-bw-02",
    submissionCode: "SUB-2026-0028",
    title: "Dấu chân trên cát ướt",
    categoryId: "cat-bw",
    categoryName: "Ảnh Đen Trắng",
    judgeCount: 3,
    scoreScale: 30,
    negativeProofVerified: true,
    scores: [
      {
        judgeId: "judge-1",
        judgeName: "Nguyễn Văn Nghệ",
        totalScore: 27,
        submittedAt: "2026-11-18T08:25:00Z",
      },
      {
        judgeId: "judge-2",
        judgeName: "Trần Minh Quân",
        totalScore: 26.5,
        submittedAt: "2026-11-18T11:10:00Z",
      },
      {
        judgeId: "judge-4",
        judgeName: "Đặng Quang Huy",
        totalScore: 27.5,
        submittedAt: "2026-11-18T16:02:00Z",
      },
    ],
  },
  {
    submissionId: "sub-bw-03",
    submissionCode: "SUB-2026-0038",
    title: "Hành lang trường cũ",
    categoryId: "cat-bw",
    categoryName: "Ảnh Đen Trắng",
    judgeCount: 3,
    scoreScale: 30,
    negativeProofVerified: true,
    scores: [
      {
        judgeId: "judge-1",
        judgeName: "Nguyễn Văn Nghệ",
        totalScore: 24,
        submittedAt: "2026-11-17T14:45:00Z",
      },
      {
        judgeId: "judge-2",
        judgeName: "Trần Minh Quân",
        totalScore: 23.5,
        submittedAt: "2026-11-17T15:20:00Z",
      },
      {
        judgeId: "judge-4",
        judgeName: "Đặng Quang Huy",
        totalScore: 24.5,
        submittedAt: "2026-11-17T16:05:00Z",
      },
    ],
  },
  {
    submissionId: "sub-bw-04",
    submissionCode: "SUB-2026-0023",
    title: "Cầu treo bên sông",
    categoryId: "cat-bw",
    categoryName: "Ảnh Đen Trắng",
    judgeCount: 3,
    scoreScale: 30,
    negativeProofVerified: true,
    scores: [
      {
        judgeId: "judge-1",
        judgeName: "Nguyễn Văn Nghệ",
        totalScore: 22,
        submittedAt: "2026-11-18T17:30:00Z",
      },
      {
        judgeId: "judge-2",
        judgeName: "Trần Minh Quân",
        totalScore: 21.5,
        submittedAt: "2026-11-18T17:55:00Z",
      },
    ],
  },
  {
    submissionId: "sub-bw-05",
    submissionCode: "SUB-2026-0047",
    title: "Mái ngói rêu phong",
    categoryId: "cat-bw",
    categoryName: "Ảnh Đen Trắng",
    judgeCount: 3,
    scoreScale: 30,
    negativeProofVerified: true,
    scores: [
      {
        judgeId: "judge-4",
        judgeName: "Đặng Quang Huy",
        totalScore: 25,
        submittedAt: "2026-11-18T18:10:00Z",
      },
    ],
  },
  {
    submissionId: "sub-st-01",
    submissionCode: "SUB-2026-0012",
    title: "Sương sớm trên phố cổ",
    categoryId: "cat-street",
    categoryName: "Ảnh Đường Phố",
    judgeCount: 3,
    scoreScale: 30,
    negativeProofVerified: true,
    scores: [
      {
        judgeId: "judge-1",
        judgeName: "Nguyễn Văn Nghệ",
        totalScore: 29,
        submittedAt: "2026-11-18T09:12:00Z",
      },
      {
        judgeId: "judge-2",
        judgeName: "Trần Minh Quân",
        totalScore: 18,
        submittedAt: "2026-11-18T12:35:00Z",
      },
      {
        judgeId: "judge-3",
        judgeName: "Hoàng Thảo My",
        totalScore: 28.5,
        submittedAt: "2026-11-18T17:20:00Z",
      },
    ],
  },
  {
    submissionId: "sub-st-02",
    submissionCode: "SUB-2026-0021",
    title: "Nhịp sống chợ đêm",
    categoryId: "cat-street",
    categoryName: "Ảnh Đường Phố",
    judgeCount: 3,
    scoreScale: 30,
    negativeProofVerified: true,
    scores: [
      {
        judgeId: "judge-1",
        judgeName: "Nguyễn Văn Nghệ",
        totalScore: 29,
        submittedAt: "2026-11-17T14:05:00Z",
      },
      {
        judgeId: "judge-2",
        judgeName: "Trần Minh Quân",
        totalScore: 20,
        submittedAt: "2026-11-17T14:50:00Z",
      },
      {
        judgeId: "judge-3",
        judgeName: "Hoàng Thảo My",
        totalScore: 28.5,
        submittedAt: "2026-11-17T18:30:00Z",
      },
    ],
  },
  {
    submissionId: "sub-st-03",
    submissionCode: "SUB-2026-0033",
    title: "Mưa chiều Hội An",
    categoryId: "cat-street",
    categoryName: "Ảnh Đường Phố",
    judgeCount: 3,
    scoreScale: 30,
    negativeProofVerified: true,
    scores: [],
  },
  {
    submissionId: "sub-st-04",
    submissionCode: "SUB-2026-0041",
    title: "Gánh hàng hoa",
    categoryId: "cat-street",
    categoryName: "Ảnh Đường Phố",
    judgeCount: 3,
    scoreScale: 30,
    negativeProofVerified: true,
    scores: [
      {
        judgeId: "judge-1",
        judgeName: "Nguyễn Văn Nghệ",
        totalScore: 26,
        submittedAt: "2026-11-17T09:40:00Z",
      },
      {
        judgeId: "judge-2",
        judgeName: "Trần Minh Quân",
        totalScore: 25.5,
        submittedAt: "2026-11-17T10:15:00Z",
      },
      {
        judgeId: "judge-3",
        judgeName: "Hoàng Thảo My",
        totalScore: 26.5,
        submittedAt: "2026-11-17T11:00:00Z",
      },
    ],
  },
  {
    submissionId: "sub-pt-01",
    submissionCode: "SUB-2026-0026",
    title: "Chân dung bà ngoại",
    categoryId: "cat-portrait",
    categoryName: "Chân Dung Phim Màu",
    judgeCount: 3,
    scoreScale: 30,
    negativeProofVerified: false,
    scores: [
      {
        judgeId: "judge-2",
        judgeName: "Trần Minh Quân",
        totalScore: 27.5,
        submittedAt: "2026-11-16T15:45:00Z",
      },
      {
        judgeId: "judge-3",
        judgeName: "Hoàng Thảo My",
        totalScore: 26,
        submittedAt: "2026-11-16T16:20:00Z",
      },
      {
        judgeId: "judge-4",
        judgeName: "Đặng Quang Huy",
        totalScore: 27,
        submittedAt: "2026-11-16T17:05:00Z",
      },
    ],
  },
  {
    submissionId: "sub-pt-02",
    submissionCode: "SUB-2026-0035",
    title: "Tóc mai trong nắng",
    categoryId: "cat-portrait",
    categoryName: "Chân Dung Phim Màu",
    judgeCount: 3,
    scoreScale: 30,
    negativeProofVerified: true,
    scores: [
      {
        judgeId: "judge-2",
        judgeName: "Trần Minh Quân",
        totalScore: 25.5,
        submittedAt: "2026-11-17T09:20:00Z",
      },
      {
        judgeId: "judge-3",
        judgeName: "Hoàng Thảo My",
        totalScore: 25,
        submittedAt: "2026-11-17T09:55:00Z",
      },
    ],
  },
];

export async function fetchMockScoreboard(): Promise<ScoreboardSnapshot> {
  return {
    entries: MOCK_SCOREBOARD_ENTRIES,
    updatedAt: new Date().toISOString(),
  };
}
