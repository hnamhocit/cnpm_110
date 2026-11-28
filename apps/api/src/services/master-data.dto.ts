export interface FilmStockDto {
  id: string;
  code: string;
  brand: string;
  name: string;
  nominal_iso: number;
  process: string;
  color_type: string;
  supported_formats: string[];
  is_dx_coded: boolean;
  description: string | null;
  status: string;
  is_deleted: boolean;
  deleted_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  created_by: string | null;
  updated_by: string | null;
  version: number;
}

export interface CameraDto {
  id: string;
  code: string;
  brand: string;
  model: string;
  camera_type: string;
  supported_format: string;
  default_lens_mount: string | null;
  has_fixed_lens: boolean;
  fixed_lens_specs: string | null;
  shutter_mechanism: string;
  production_start_year: number | null;
  production_end_year: number | null;
  status: string;
  is_deleted: boolean;
  deleted_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  created_by: string | null;
  updated_by: string | null;
  version: number;
}

export interface LensDto {
  id: string;
  code: string;
  brand: string;
  model: string;
  mount_type: string;
  focal_length_min_mm: number;
  focal_length_max_mm: number | null;
  is_prime: boolean;
  max_aperture: number;
  min_aperture: number | null;
  format_coverage: string[];
  status: string;
  is_deleted: boolean;
  deleted_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  created_by: string | null;
  updated_by: string | null;
  version: number;
}

export interface FilmLabDto {
  id: string;
  code: string;
  name: string;
  country_code: string;
  city: string;
  address: string | null;
  website_url: string | null;
  email: string | null;
  phone: string | null;
  supported_processes: string[];
  scanners: string[];
  is_verified_partner: boolean;
  status: string;
  is_deleted: boolean;
  deleted_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  created_by: string | null;
  updated_by: string | null;
  version: number;
}

export function toFilmStockDto(row: {
  id: string;
  code: string;
  brand: string;
  name: string;
  nominalIso: number;
  process: string;
  colorType: string;
  supportedFormats: string[];
  isDxCoded: boolean;
  description: string | null;
  status: string;
  isDeleted: boolean;
  deletedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
}): FilmStockDto {
  return {
    id: row.id,
    code: row.code,
    brand: row.brand,
    name: row.name,
    nominal_iso: row.nominalIso,
    process: row.process,
    color_type: row.colorType,
    supported_formats: row.supportedFormats,
    is_dx_coded: row.isDxCoded,
    description: row.description,
    status: row.status,
    is_deleted: row.isDeleted,
    deleted_at: row.deletedAt,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    created_by: row.createdBy,
    updated_by: row.updatedBy,
    version: row.version,
  };
}

export function toCameraDto(row: {
  id: string;
  code: string;
  brand: string;
  model: string;
  cameraType: string;
  supportedFormat: string;
  defaultLensMount: string | null;
  hasFixedLens: boolean;
  fixedLensSpecs: string | null;
  shutterMechanism: string;
  productionStartYear: number | null;
  productionEndYear: number | null;
  status: string;
  isDeleted: boolean;
  deletedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
}): CameraDto {
  return {
    id: row.id,
    code: row.code,
    brand: row.brand,
    model: row.model,
    camera_type: row.cameraType,
    supported_format: row.supportedFormat,
    default_lens_mount: row.defaultLensMount,
    has_fixed_lens: row.hasFixedLens,
    fixed_lens_specs: row.fixedLensSpecs,
    shutter_mechanism: row.shutterMechanism,
    production_start_year: row.productionStartYear,
    production_end_year: row.productionEndYear,
    status: row.status,
    is_deleted: row.isDeleted,
    deleted_at: row.deletedAt,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    created_by: row.createdBy,
    updated_by: row.updatedBy,
    version: row.version,
  };
}

export function toLensDto(row: {
  id: string;
  code: string;
  brand: string;
  model: string;
  mountType: string;
  focalLengthMinMm: string | number;
  focalLengthMaxMm: string | number | null;
  isPrime: boolean;
  maxAperture: string | number;
  minAperture: string | number | null;
  formatCoverage: string[];
  status: string;
  isDeleted: boolean;
  deletedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
}): LensDto {
  return {
    id: row.id,
    code: row.code,
    brand: row.brand,
    model: row.model,
    mount_type: row.mountType,
    focal_length_min_mm: Number(row.focalLengthMinMm),
    focal_length_max_mm:
      row.focalLengthMaxMm === null ? null : Number(row.focalLengthMaxMm),
    is_prime: row.isPrime,
    max_aperture: Number(row.maxAperture),
    min_aperture: row.minAperture === null ? null : Number(row.minAperture),
    format_coverage: row.formatCoverage,
    status: row.status,
    is_deleted: row.isDeleted,
    deleted_at: row.deletedAt,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    created_by: row.createdBy,
    updated_by: row.updatedBy,
    version: row.version,
  };
}

export function toFilmLabDto(row: {
  id: string;
  code: string;
  name: string;
  countryCode: string;
  city: string;
  address: string | null;
  websiteUrl: string | null;
  email: string | null;
  phone: string | null;
  supportedProcesses: string[];
  scanners: string[];
  isVerifiedPartner: boolean;
  status: string;
  isDeleted: boolean;
  deletedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
}): FilmLabDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    country_code: row.countryCode,
    city: row.city,
    address: row.address,
    website_url: row.websiteUrl,
    email: row.email,
    phone: row.phone,
    supported_processes: row.supportedProcesses,
    scanners: row.scanners,
    is_verified_partner: row.isVerifiedPartner,
    status: row.status,
    is_deleted: row.isDeleted,
    deleted_at: row.deletedAt,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    created_by: row.createdBy,
    updated_by: row.updatedBy,
    version: row.version,
  };
}
