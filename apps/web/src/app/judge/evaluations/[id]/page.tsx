import type { Metadata } from "next";
import type { BlindEvaluationSubmission, ScoringCriterion } from "@/types/judging";
import { FocusJudgingView } from "@/components/judging/focus-judging-view";

export const metadata: Metadata = {
  title: "Chấm thi ẩn danh (Focus Mode) | CINEGEN",
  description: "Giao diện chấm thi chuyên sâu cho ban giám khảo với công cụ soi hạt phim và slider chấm điểm chuẩn BR-12.",
};

const MOCK_CRITERIA: ScoringCriterion[] = [
  {
    id: "crit-1",
    name: "Ý tưởng nghệ thuật & Tính nguyên bản",
    description: "Độ sáng tạo, thông điệp truyền tải và bố cục thị giác",
    maxScore: 10,
    weight: 40,
  },
  {
    id: "crit-2",
    name: "Kỹ thuật phơi sáng & Bố cục",
    description: "Kiểm soát độ nét, vùng tương phản sáng/tối và góc đặt máy",
    maxScore: 10,
    weight: 30,
  },
  {
    id: "crit-3",
    name: "Khai thác chất cảm phim Analog",
    description: "Độ mịn hạt grain, dải chuyển tông màu đặc trưng của cuộn phim",
    maxScore: 10,
    weight: 30,
  },
];

const MOCK_SUBMISSION: BlindEvaluationSubmission = {
  id: "sub-101",
  anonymousCode: "ANON-SUB-2026-089",
  contestId: "c-01",
  contestName: "Sắc Màu Phố Cổ 2026",
  categoryName: "Đời sống & Con người",
  roundName: "Vòng Chung kết",
  title: "Ánh sáng ngõ nhỏ Hội An",
  caption: "Tia nắng sớm xiên qua tán cây hoa giấy rọi xuống nền gạch cổ.",
  imageOriginalUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1600&auto=format&fit=crop",
  filmRoll: {
    stock: "Kodak Portra 400",
    format: "120 Medium Format",
    iso: 400,
    labScan: "Llab Saigon - Noritsu HS-1800 Hi-Res TIFF",
  },
  cameraMetadata: {
    camera: "Mamiya RZ67 Pro II",
    lens: "Sekor Z 110mm f/2.8",
    shutterSpeed: "1/125s",
    aperture: "f/4.0",
  },
  status: "PENDING_EVALUATION",
};

interface JudgingPageProps {
  params: Promise<{ id: string }>;
}

export default async function JudgingDetailPage({ params }: JudgingPageProps) {
  const resolved = await params;
  const submission = {
    ...MOCK_SUBMISSION,
    anonymousCode: `ANON-${resolved.id.toUpperCase()}`,
  };

  return <FocusJudgingView submission={submission} criteria={MOCK_CRITERIA} />;
}

