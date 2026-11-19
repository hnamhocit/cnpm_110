"use client";

import { useMemo, useState } from "react";
import { Film, Sparkles } from "lucide-react";
import type { ArchiveArtwork, ArchiveFilterState } from "@/types/archive";
import { MOCK_ARCHIVE_ARTWORKS } from "@/lib/mock-archive";
import { filterArchiveArtworks } from "@/lib/archive-utils";
import { ArchiveFilters } from "@/components/archive/archive-filters";
import { MasonryGrid } from "@/components/archive/masonry-grid";
import { ArtworkDetailModal } from "@/components/archive/artwork-detail-modal";
import { EmptyState } from "@/components/ui/empty-state";

export function ArchiveClientView() {
  const [selectedArtwork, setSelectedArtwork] = useState<ArchiveArtwork | null>(null);
  const [filters, setFilters] = useState<ArchiveFilterState>({
    searchQuery: "",
    year: "all",
    filmStock: "all",
    filmFormat: "all",
    awardOnly: false,
  });

  const filteredArtworks = useMemo(() => {
    return filterArchiveArtworks(MOCK_ARCHIVE_ARTWORKS, filters);
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      year: "all",
      filmStock: "all",
      filmFormat: "all",
      awardOnly: false,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>Bảo tàng Kỹ thuật số Di sản Ảnh Phim Analog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Triển Lãm Số (Digital Archive)
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Nơi lưu trữ và tôn vinh những tác phẩm đạt giải từ các mùa thi. Toàn bộ hình ảnh được quét độ phân giải cao và lưu giữ thông số lab, máy cơ và cuộn phim nguyên bản.
        </p>
      </div>

      {/* Filter Toolbar */}
      <ArchiveFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Grid or Empty State */}
      {filteredArtworks.length > 0 ? (
        <MasonryGrid
          artworks={filteredArtworks}
          onSelectArtwork={(art) => setSelectedArtwork(art)}
        />
      ) : (
        <EmptyState
          icon={<Film className="w-8 h-8 text-sky-600" />}
          title="Không tìm thấy tác phẩm triển lãm phù hợp"
          description="Rất tiếc không có tác phẩm nào khớp với bộ lọc tìm kiếm hiện tại. Hãy thử đổi từ khoá hoặc đặt lại bộ lọc."
          action={{
            label: "Đặt lại bộ lọc",
            onClick: handleResetFilters,
          }}
        />
      )}

      {/* Modal chi tiết tác phẩm đạt giải */}
      <ArtworkDetailModal
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
      />
    </div>
  );
}

