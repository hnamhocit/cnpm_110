export interface ScoringCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  weight: number; // Tỷ trọng %, tổng các tiêu chí = 100%
}

export interface BlindEvaluationSubmission {
  id: string; // Mã bài ẩn danh, ví dụ SUB-2026-089 (không lộ thông tin thí sinh per BR-12)
  anonymousCode: string;
  contestId: string;
  contestName: string;
  categoryName: string;
  roundName: string;
  title: string;
  caption?: string;
  imageOriginalUrl: string;
  filmRoll: {
    stock: string;
    format: string;
    iso: number;
    labScan?: string;
  };
  cameraMetadata?: {
    camera?: string;
    lens?: string;
    shutterSpeed?: string;
    aperture?: string;
  };
  status: "PENDING_EVALUATION" | "EVALUATED";
}

export interface ScorecardInput {
  scores: Record<string, number>; // criterionId -> điểm
  comments: string;
}

