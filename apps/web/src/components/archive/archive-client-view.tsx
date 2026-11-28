"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Film, Sparkles } from "lucide-react";
import type { ArchiveArtwork, ArchiveFilterState } from "@/types/archive";
import { filterArchiveArtworks } from "@/lib/archive-utils";
import {
  getExhibition,
  getExhibitionErrorMessage,
  getExhibitions,
  isAbortError,
  mergeArchiveArtworkDetail,
  toArchiveArtwork,
} from "@/lib/exhibition-api";
import { ArchiveFilters } from "@/components/archive/archive-filters";
import { MasonryGrid } from "@/components/archive/masonry-grid";
import { ArtworkDetailModal } from "@/components/archive/artwork-detail-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

interface ArchiveClientViewProps {
  initialContestId?: string;
}

const API_PAGE_SIZE = 100;
const CLIENT_PAGE_SIZE = 12;

function createDefaultFilters(initialContestId?: string): ArchiveFilterState {
  return {
    searchQuery: "",
    year: "all",
    filmStock: "all",
    filmFormat: "all",
    awardOnly: false,
    contestId: initialContestId ?? "",
    camera: "",
    aiTag: "",
  };
}

export function ArchiveClientView({ initialContestId }: ArchiveClientViewProps) {
  const [selectedArtwork, setSelectedArtwork] = useState<ArchiveArtwork | null>(null);
  const [filters, setFilters] = useState<ArchiveFilterState>(() =>
    createDefaultFilters(initialContestId),
  );
  const [allArtworks, setAllArtworks] = useState<ArchiveArtwork[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const selectedIdRef = useRef<string | null>(null);
  const detailControllerRef = useRef<AbortController | null>(null);

  const { contestId, year, filmStock, filmFormat, camera, aiTag } = filters;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function loadAllArtworks() {
      try {
        const firstPage = await getExhibitions(
          {
            contestId,
            year,
            filmStock,
            filmFormat,
            camera,
            aiTag,
            page: 1,
            limit: API_PAGE_SIZE,
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;

        const collected = firstPage.items.map(toArchiveArtwork);
        const totalPages = Math.max(1, firstPage.pagination?.totalPages ?? 1);

        for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
          if (controller.signal.aborted) return;
          const response = await getExhibitions(
            {
              contestId,
              year,
              filmStock,
              filmFormat,
              camera,
              aiTag,
              page: nextPage,
              limit: API_PAGE_SIZE,
            },
            controller.signal,
          );
          if (controller.signal.aborted) return;
          collected.push(...response.items.map(toArchiveArtwork));
        }

        if (controller.signal.aborted) return;
        setAllArtworks(collected);
      } catch (err: unknown) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(getExhibitionErrorMessage(err));
        setAllArtworks([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadAllArtworks();
    return () => controller.abort();
  }, [contestId, year, filmStock, filmFormat, camera, aiTag, reloadKey]);

  useEffect(
    () => () => {
      detailControllerRef.current?.abort();
    },
    [],
  );

  const filteredArtworks = useMemo(
    () => filterArchiveArtworks(allArtworks, filters),
    [allArtworks, filters],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredArtworks.length / CLIENT_PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const pageArtworks = useMemo(
    () =>
      filteredArtworks.slice(
        (currentPage - 1) * CLIENT_PAGE_SIZE,
        currentPage * CLIENT_PAGE_SIZE,
      ),
    [filteredArtworks, currentPage],
  );

  const handleFiltersChange = useCallback((next: ArchiveFilterState) => {
    setFilters(next);
    setPage(1);
  }, []);

  const handleResetFilters = () => {
    setFilters(createDefaultFilters(initialContestId));
    setPage(1);
  };

  const handleSelectArtwork = (art: ArchiveArtwork) => {
    detailControllerRef.current?.abort();
    const controller = new AbortController();
    detailControllerRef.current = controller;
    selectedIdRef.current = art.id;
    setSelectedArtwork(art);

    getExhibition(art.id, controller.signal)
      .then((detail) => {
        if (controller.signal.aborted || selectedIdRef.current !== art.id) return;
        setSelectedArtwork((current) =>
          current?.id === art.id ? mergeArchiveArtworkDetail(current, detail) : current,
        );
      })
      .catch((err: unknown) => {
        if (isAbortError(err) || controller.signal.aborted) return;
      })
      .finally(() => {
        if (detailControllerRef.current === controller) {
          detailControllerRef.current = null;
        }
      });
  };

  const handleCloseModal = () => {
    detailControllerRef.current?.abort();
    detailControllerRef.current = null;
    selectedIdRef.current = null;
    setSelectedArtwork(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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

      <ArchiveFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
          Đang tải tác phẩm triển lãm...
        </div>
      ) : error ? (
        <div className="py-16 text-center space-y-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
            Thử lại
          </Button>
        </div>
      ) : filteredArtworks.length > 0 ? (
        <>
          <MasonryGrid artworks={pageArtworks} onSelectArtwork={handleSelectArtwork} />
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Trang trước
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Trang sau
            </Button>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Film className="w-8 h-8 text-sky-600" />}
          title="Không tìm thấy tác phẩm triển lãm phù hợp"
          description="Rất tiếc không có tác phẩm nào khớp với bộ lọc tìm kiếm hiện tại. Hãy thử đổi từ khóa hoặc đặt lại bộ lọc."
          action={{ label: "Đặt lại bộ lọc", onClick: handleResetFilters }}
        />
      )}

      <ArtworkDetailModal artwork={selectedArtwork} onClose={handleCloseModal} />
    </div>
  );
}
