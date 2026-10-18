export type ContestStatus =
  | "draft"
  | "published"
  | "ongoing"
  | "completed"
  | "cancelled";

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
  /** Thể loại phim (ví dụ: 35mm, Medium Format, Trắng đen) */
  category?: string;
  /** Phần thưởng hoặc ghi chú thêm (nếu có) */
  prize?: string;
  /** Ảnh bìa cuộc thi (nếu có) */
  cover_image?: string;
}

export interface ContestListResponse {
  data: Contest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
