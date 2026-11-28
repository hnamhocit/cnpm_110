export type ExhibitionStatus =
  | "PENDING"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "PUBLISHED"
  | "ARCHIVED";

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T | null;
  error: string | null;
};

export interface ContestExhibitionItem {
  id: string;
  submissionId: string;
  contestId: string;
  title: string;
  author?: string | null;
  status: ExhibitionStatus;
  watermarked: boolean;
  copyright?: string | null;
  imageUrl?: string | null;
  errorMessage?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ArchiveContestInput {
  submissionIds?: string[];
  includeFinalists?: boolean;
  generateWebp?: boolean;
  applyWatermark?: boolean;
  publish?: boolean;
}

export interface ArchiveContestResponse {
  contestId: string;
  archiveStatus: ExhibitionStatus;
  message: string;
  items: Array<{
    exhibitionId: string;
    submissionId: string;
    contestId: string;
    status: ExhibitionStatus;
    watermarked: boolean;
    copyright?: string | null;
    imageUrl?: string | null;
    publishedAt?: string | null;
  }>;
}

export interface ProcessExhibitionInput {
  generateWebp?: boolean;
  applyWatermark?: boolean;
  publish?: boolean;
}

export interface ExhibitionStatusUpdate {
  status: "PUBLISHED" | "READY" | "ARCHIVED";
}

export interface ExhibitionActionResponse {
  id?: string;
  exhibitionId?: string;
  submissionId?: string;
  contestId?: string;
  status: ExhibitionStatus;
  watermarked?: boolean;
  copyright?: string | null;
  imageUrl?: string | null;
  errorMessage?: string | null;
  publishedAt?: string | null;
  isDeleted?: boolean;
}

export interface PublicExhibitionItem {
  id: string;
  submissionId: string;
  contestId: string;
  contestName: string;
  categoryName: string;
  title: string;
  author: string;
  filmStock: string | null;
  camera: string | null;
  filmFormat: string | null;
  year: number;
  award: string | null;
  awardTitle: string | null;
  rank: number | null;
  finalScore: number | null;
  aiTags: string[];
  imageUrl: string;
  watermarked: boolean;
  copyright: string | null;
  publishedAt: string | null;
}

export interface PublicExhibitionDetail extends PublicExhibitionItem {
  description: string | null;
  filmBrand: string | null;
  iso: number | null;
  lens: string | null;
  lab: string | null;
  scannerModel: string | null;
}

export interface ExhibitionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExhibitionListResponse {
  items: PublicExhibitionItem[];
  pagination: ExhibitionPagination;
}

export interface ExhibitionQueryFilters {
  contestId?: string;
  year?: string | number;
  filmStock?: string;
  camera?: string;
  filmFormat?: string;
  aiTag?: string;
  award?: string;
  page?: string | number;
  limit?: string | number;
}
