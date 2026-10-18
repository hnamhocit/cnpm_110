export type ContestStatus =
  | "draft"
  | "published"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface Judge {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar_url?: string;
}

export interface Prize {
  id: string;
  rank: string; // "Giải Nhất", "Giải Nhì", "Giải Ba", v.v.
  name: string;
  reward: string; // "30.000.000 VNĐ + Máy ảnh Leica M6"
  description?: string;
}

export interface Criteria {
  id: string;
  name: string;
  weight: number; // Tỷ trọng phần trăm (ví dụ: 30%)
  description: string;
}

export interface Contest {
  id: string;
  name: string;
  description: string | null;
  start_at: string;
  end_at: string;
  status: ContestStatus;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  category?: string;
  prize?: string;
  cover_image?: string;

  // Các trường chi tiết cho FPC-38
  rules?: string[];
  film_requirements?: {
    formats: string[]; // ["35mm", "120 Medium Format"]
    types: string[]; // ["Color Negative", "Black & White", "Slide/Color Reversal"]
    max_photos_per_submission: number;
    allow_digital_editing: boolean;
  };
  judges?: Judge[];
  prizes?: Prize[];
  criteria?: Criteria[];
}

export interface ContestListResponse {
  data: Contest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
