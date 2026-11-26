import type {
  Camera,
  CameraInput,
  FilmLab,
  FilmLabInput,
  FilmStock,
  FilmStockInput,
  Lens,
  LensInput,
  MasterDataEntity,
  MasterDataInput,
} from "@/types/master-data";

// Bỏ dấu tiếng Việt và ký tự không phải chữ/số để sinh mã dễ đọc.
export function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // "f/2" -> "f2" để mã ống kính gọn như ví dụ LENS-…-F2.
      .replace(/([a-zA-Z])\/(\d)/g, "$1$2")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase()
  );
}

// Xem trước mã tự sinh theo CR-05; server vẫn là nguồn chính thức.
export function buildMasterDataCode(
  entity: MasterDataEntity,
  input: MasterDataInput,
): string {
  switch (entity) {
    case "film-stocks": {
      const film = input as FilmStockInput;
      const nameSlug = slugify(film.name ?? "");
      const iso = String(film.nominal_iso ?? "");
      // Tên dòng phim thường đã chứa ISO (VD: Portra 400) — tránh lặp "-400-400".
      const includeIso = iso !== "" && !nameSlug.split("-").includes(iso);
      return [
        "FILM",
        slugify(film.brand ?? ""),
        nameSlug,
        includeIso ? iso : "",
      ]
        .filter(Boolean)
        .join("-");
    }
    case "cameras": {
      const camera = input as CameraInput;
      return ["CAM", slugify(camera.brand ?? ""), slugify(camera.model ?? "")]
        .filter(Boolean)
        .join("-");
    }
    case "lenses": {
      const lens = input as LensInput;
      const focal =
        typeof lens.focal_length_min_mm === "number"
          ? `${Number(lens.focal_length_min_mm.toFixed(2))}MM`
          : "";
      return [
        "LENS",
        slugify(lens.brand ?? ""),
        slugify(lens.model ?? ""),
        focal,
      ]
        .filter(Boolean)
        .join("-");
    }
    case "film-labs": {
      const lab = input as FilmLabInput;
      return [
        "LAB",
        (lab.country_code ?? "").toUpperCase(),
        slugify(lab.name ?? ""),
        slugify(lab.city ?? ""),
      ]
        .filter(Boolean)
        .join("-");
    }
  }
}

export function formatFocalLength(lens: Lens): string {
  const min = Number(lens.focal_length_min_mm.toFixed(2));
  if (
    lens.is_prime ||
    lens.focal_length_max_mm === null ||
    lens.focal_length_max_mm === undefined
  ) {
    return `${min}mm`;
  }
  return `${min}–${Number(lens.focal_length_max_mm.toFixed(2))}mm`;
}

export function formatAperture(lens: Lens): string {
  const max = Number(lens.max_aperture.toFixed(1));
  const min =
    lens.min_aperture === null || lens.min_aperture === undefined
      ? null
      : Number(lens.min_aperture.toFixed(1));
  return min === null ? `f/${max}` : `f/${max}–${min}`;
}

export function formatLocation(lab: FilmLab): string {
  return [lab.city, lab.country_code].filter(Boolean).join(", ");
}

export function formatFilmSpecs(stock: FilmStock): string {
  return `${stock.process} · ISO ${stock.nominal_iso}`;
}

export function formatCameraSpecs(camera: Camera): string {
  return `${camera.supported_format} · ${camera.shutter_mechanism}`;
}
