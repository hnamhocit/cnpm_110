// DTO danh mục dùng chung — bám hợp đồng docs/ai/02-analog-master-data.md §4.
// Hợp đồng dùng snake_case; UI giữ nguyên tên trường để tránh map hai chiều.

export const MASTER_DATA_STATUSES = ["DRAFT", "ACTIVE", "DEPRECATED"] as const;
export type MasterDataStatus = (typeof MASTER_DATA_STATUSES)[number];

export const FILM_PROCESSES = ["C-41", "B&W", "E-6", "ECN-2"] as const;
export type FilmProcess = (typeof FILM_PROCESSES)[number];

export const FILM_FORMATS = [
  "135",
  "120",
  "4x5",
  "8x10",
  "110",
  "HALF_FRAME",
] as const;
export type FilmFormat = (typeof FILM_FORMATS)[number];

export const COLOR_TYPES = [
  "COLOR_NEGATIVE",
  "BLACK_AND_WHITE",
  "COLOR_SLIDE_POSITIVE",
  "MOTION_PICTURE_COLOR",
] as const;
export type ColorType = (typeof COLOR_TYPES)[number];

export const CAMERA_TYPES = [
  "SLR",
  "RANGEFINDER",
  "TLR",
  "POINT_AND_SHOOT",
  "MEDIUM_FORMAT_SLR",
  "MEDIUM_FORMAT_RANGEFINDER",
  "LARGE_FORMAT",
  "PINHOLE",
  "OTHER",
] as const;
export type CameraType = (typeof CAMERA_TYPES)[number];

export const SHUTTER_MECHANISMS = [
  "MECHANICAL",
  "ELECTRONIC",
  "HYBRID",
] as const;
export type ShutterMechanism = (typeof SHUTTER_MECHANISMS)[number];

export const SCANNERS = [
  "NORITSU_HS1800",
  "FUJI_FRONTIER_SP3000",
  "HASSELBLAD_FLEXTIGHT_X5",
  "DSLR_SCAN",
  "EPSON_V850",
  "OTHER",
] as const;
export type Scanner = (typeof SCANNERS)[number];

export type MasterDataEntity =
  | "film-stocks"
  | "cameras"
  | "lenses"
  | "film-labs";

type BaseRecord = {
  id: string;
  code: string;
  status: MasterDataStatus;
  is_deleted?: boolean;
  version?: number;
  created_at?: string;
  updated_at?: string;
};

export type FilmStock = BaseRecord & {
  brand: string;
  name: string;
  nominal_iso: number;
  process: FilmProcess;
  color_type: ColorType;
  supported_formats: FilmFormat[];
  is_dx_coded: boolean;
  description?: string | null;
};

export type Camera = BaseRecord & {
  brand: string;
  model: string;
  camera_type: CameraType;
  supported_format: FilmFormat;
  default_lens_mount?: string | null;
  has_fixed_lens: boolean;
  fixed_lens_specs?: string | null;
  shutter_mechanism: ShutterMechanism;
  production_start_year?: number | null;
  production_end_year?: number | null;
};

export type Lens = BaseRecord & {
  brand: string;
  model: string;
  mount_type: string;
  focal_length_min_mm: number;
  focal_length_max_mm?: number | null;
  is_prime: boolean;
  max_aperture: number;
  min_aperture?: number | null;
  format_coverage: FilmFormat[];
};

export type FilmLab = BaseRecord & {
  name: string;
  country_code: string;
  city: string;
  address?: string | null;
  website_url?: string | null;
  email?: string | null;
  phone?: string | null;
  supported_processes: FilmProcess[];
  scanners: Scanner[];
};

export type MasterDataRecord = FilmStock | Camera | Lens | FilmLab;

export type FilmStockInput = Omit<
  FilmStock,
  | "id"
  | "code"
  | "status"
  | "is_deleted"
  | "version"
  | "created_at"
  | "updated_at"
>;
export type CameraInput = Omit<
  Camera,
  | "id"
  | "code"
  | "status"
  | "is_deleted"
  | "version"
  | "created_at"
  | "updated_at"
>;
export type LensInput = Omit<
  Lens,
  | "id"
  | "code"
  | "status"
  | "is_deleted"
  | "version"
  | "created_at"
  | "updated_at"
>;
export type FilmLabInput = Omit<
  FilmLab,
  | "id"
  | "code"
  | "status"
  | "is_deleted"
  | "version"
  | "created_at"
  | "updated_at"
>;

export type MasterDataInput =
  | FilmStockInput
  | CameraInput
  | LensInput
  | FilmLabInput;

export type PaginatedMasterData<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Nhãn hiển thị tiếng Việt cho enum.
export const PROCESS_LABELS: Record<FilmProcess, string> = {
  "C-41": "C-41",
  "B&W": "B&W",
  "E-6": "E-6",
  "ECN-2": "ECN-2",
};

export const FORMAT_LABELS: Record<FilmFormat, string> = {
  "135": "135",
  "120": "120",
  "4x5": "4x5",
  "8x10": "8x10",
  "110": "110",
  HALF_FRAME: "Half Frame",
};

export const COLOR_TYPE_LABELS: Record<ColorType, string> = {
  COLOR_NEGATIVE: "Âm bản màu",
  BLACK_AND_WHITE: "Đen trắng",
  COLOR_SLIDE_POSITIVE: "Dương bản (Slide)",
  MOTION_PICTURE_COLOR: "Phim điện ảnh màu",
};

export const CAMERA_TYPE_LABELS: Record<CameraType, string> = {
  SLR: "SLR",
  RANGEFINDER: "Rangefinder",
  TLR: "TLR",
  POINT_AND_SHOOT: "Point & Shoot",
  MEDIUM_FORMAT_SLR: "Medium Format SLR",
  MEDIUM_FORMAT_RANGEFINDER: "Medium Format Rangefinder",
  LARGE_FORMAT: "Large Format",
  PINHOLE: "Pinhole",
  OTHER: "Khác",
};

export const SHUTTER_LABELS: Record<ShutterMechanism, string> = {
  MECHANICAL: "Cơ học",
  ELECTRONIC: "Điện tử",
  HYBRID: "Lai",
};

export const SCANNER_LABELS: Record<Scanner, string> = {
  NORITSU_HS1800: "Noritsu HS-1800",
  FUJI_FRONTIER_SP3000: "Fuji Frontier SP3000",
  HASSELBLAD_FLEXTIGHT_X5: "Hasselblad Flextight X5",
  DSLR_SCAN: "DSLR Scan",
  EPSON_V850: "Epson V850",
  OTHER: "Khác",
};

export const STATUS_LABELS: Record<MasterDataStatus, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang dùng",
  DEPRECATED: "Ngừng lưu hành",
};

export const ENTITY_LABELS: Record<
  MasterDataEntity,
  { singular: string; plural: string }
> = {
  "film-stocks": { singular: "Film Stock", plural: "Film Stocks" },
  cameras: { singular: "Máy ảnh", plural: "Máy ảnh" },
  lenses: { singular: "Ống kính", plural: "Ống kính" },
  "film-labs": { singular: "Phòng Lab", plural: "Phòng Lab" },
};
