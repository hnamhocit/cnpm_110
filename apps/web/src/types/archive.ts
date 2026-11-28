export interface ArchiveArtwork {
  id: string;
  title: string;
  author_name: string;
  contest_id: string;
  contest_name: string;
  year: number;
  category: string;
  award?: string; // Ví dụ: "Giải Nhất", "Giải Nhì", "Tác phẩm xuất sắc"
  image_url: string;
  aspect_ratio?: "portrait" | "landscape" | "square";
  film_stock: string; // Ví dụ: "Kodak Portra 400", "Fujifilm Superia 400", "Ilford HP5 Plus"
  film_format: "35mm" | "120" | "Large Format";
  iso?: number;
  camera?: string;
  lens?: string;
  shutter_speed?: string;
  aperture?: string;
  lab_scan?: string; // Ví dụ: "Llab - Noritsu HS-1800", "Croplab - Frontier SP3000"
  description?: string;
  copyright?: string;
  awardTitle?: string;
  watermarked?: boolean;
}

export interface ArchiveFilterState {
  searchQuery: string;
  year: string;
  filmStock: string;
  filmFormat: string;
  awardOnly: boolean;
  contestId?: string;
  camera?: string;
  aiTag?: string;
}
