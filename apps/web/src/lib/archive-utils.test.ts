import { describe, expect, it } from "bun:test";
import type { ArchiveArtwork, ArchiveFilterState } from "@/types/archive";
import { filterArchiveArtworks } from "./archive-utils";

const sampleArtworks: ArchiveArtwork[] = [
  {
    id: "1",
    title: "Nắng Sài Gòn",
    author_name: "Nguyễn Văn A",
    contest_id: "c-1",
    contest_name: "Phố Thị 2026",
    year: 2026,
    category: "Đường phố",
    award: "Giải Nhất",
    image_url: "https://example.com/1.jpg",
    film_stock: "Kodak Portra 400",
    film_format: "35mm",
    iso: 400,
  },
  {
    id: "2",
    title: "Mùa lúa chín",
    author_name: "Trần Thị B",
    contest_id: "c-2",
    contest_name: "Đất Nước 2025",
    year: 2025,
    category: "Phong cảnh",
    award: "Giải Nhì",
    image_url: "https://example.com/2.jpg",
    film_stock: "Fujifilm Superia 400",
    film_format: "120",
    iso: 400,
  },
  {
    id: "3",
    title: "Không tên",
    author_name: "Lê C",
    contest_id: "c-1",
    contest_name: "Phố Thị 2026",
    year: 2026,
    category: "Tự do",
    image_url: "https://example.com/3.jpg",
    film_stock: "Ilford HP5 Plus",
    film_format: "35mm",
    iso: 400,
  },
];

describe("FPC-99 / FPC-97 Archive Utils", () => {
  it("lọc theo từ khoá tìm kiếm tên tác phẩm và tác giả", () => {
    const filters: ArchiveFilterState = {
      searchQuery: "Nắng Sài Gòn",
      year: "all",
      filmStock: "all",
      filmFormat: "all",
      awardOnly: false,
    };
    const res = filterArchiveArtworks(sampleArtworks, filters);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("1");
  });

  it("lọc theo Film Stock", () => {
    const filters: ArchiveFilterState = {
      searchQuery: "",
      year: "all",
      filmStock: "Superia",
      filmFormat: "all",
      awardOnly: false,
    };
    const res = filterArchiveArtworks(sampleArtworks, filters);
    expect(res).toHaveLength(1);
    expect(res[0].title).toBe("Mùa lúa chín");
  });

  it("lọc theo định dạng khổ phim (Format)", () => {
    const filters: ArchiveFilterState = {
      searchQuery: "",
      year: "all",
      filmStock: "all",
      filmFormat: "120",
      awardOnly: false,
    };
    const res = filterArchiveArtworks(sampleArtworks, filters);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("2");
  });

  it("lọc chỉ tác phẩm đạt giải (awardOnly)", () => {
    const filters: ArchiveFilterState = {
      searchQuery: "",
      year: "all",
      filmStock: "all",
      filmFormat: "all",
      awardOnly: true,
    };
    const res = filterArchiveArtworks(sampleArtworks, filters);
    expect(res).toHaveLength(2);
    expect(res.map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("bỏ khoảng trắng thừa ở từ khoá tìm kiếm", () => {
    const filters: ArchiveFilterState = {
      searchQuery: "  Nắng Sài Gòn  ",
      year: "all",
      filmStock: "all",
      filmFormat: "all",
      awardOnly: false,
    };
    const res = filterArchiveArtworks(sampleArtworks, filters);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("1");
  });

  it("tìm kiếm theo film stock trong từ khoá", () => {
    const filters: ArchiveFilterState = {
      searchQuery: "  hp5  ",
      year: "all",
      filmStock: "all",
      filmFormat: "all",
      awardOnly: false,
    };
    const res = filterArchiveArtworks(sampleArtworks, filters);
    expect(res).toHaveLength(1);
    expect(res[0].title).toBe("Không tên");
  });
});
