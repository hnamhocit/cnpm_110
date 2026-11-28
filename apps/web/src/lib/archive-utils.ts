import type { ArchiveArtwork, ArchiveFilterState } from "@/types/archive";

export function filterArchiveArtworks(
  artworks: ArchiveArtwork[],
  filters: ArchiveFilterState,
): ArchiveArtwork[] {
  return artworks.filter((item) => {
    // Search Query (Tên tác phẩm, tác giả, cuộc thi, máy ảnh)
    const searchQuery = filters.searchQuery.trim();
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchText =
        item.title.toLowerCase().includes(q) ||
        item.author_name.toLowerCase().includes(q) ||
        item.contest_name.toLowerCase().includes(q) ||
        item.film_stock.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.camera?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.lab_scan?.toLowerCase().includes(q);

      if (!matchText) return false;
    }

    // Lọc theo năm
    if (filters.year && filters.year !== "all") {
      if (item.year.toString() !== filters.year) return false;
    }

    // Lọc theo Film stock
    if (filters.filmStock && filters.filmStock !== "all") {
      if (
        !item.film_stock.toLowerCase().includes(filters.filmStock.toLowerCase())
      ) {
        return false;
      }
    }

    // Lọc theo định dạng phim (35mm / 120 / Large Format)
    if (filters.filmFormat && filters.filmFormat !== "all") {
      if (item.film_format !== filters.filmFormat) return false;
    }

    // Chỉ xem tác phẩm đạt giải cao (Giải Nhất, Giải Nhì, Giải Ba, Giải Xuất sắc)
    if (filters.awardOnly) {
      if (!item.award) return false;
    }

    return true;
  });
}
