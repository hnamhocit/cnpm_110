"use client";

import { useState } from "react";
import {
  Award,
  Camera,
  Copyright,
  Film,
  Info,
  Maximize2,
  X,
} from "lucide-react";
import type { ArchiveArtwork } from "@/types/archive";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FALLBACK_IMAGE =
  "https://placehold.co/1200x800/0f172a/e2e8f0?text=No+image";

interface ArtworkDetailModalProps {
  artwork: ArchiveArtwork | null;
  onClose: () => void;
}

export function ArtworkDetailModal({
  artwork,
  onClose,
}: ArtworkDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"spec" | "story">("spec");
  const [zoomMode, setZoomMode] = useState(false);
  const [failedImageId, setFailedImageId] = useState<string | null>(null);

  if (!artwork) return null;

  const imageFailed = failedImageId === artwork.id;

  const copyrightText =
    artwork.copyright?.trim() ||
    `© ${artwork.year} ${artwork.author_name}. Mọi quyền được bảo lưu.`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col lg:flex-row">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all shadow-md focus:outline-none"
          aria-label="Đóng modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative flex-1 min-h-[300px] lg:min-h-[560px] bg-slate-950 flex items-center justify-center p-4 overflow-hidden group">
          <div
            className={`relative w-full h-full flex items-center justify-center transition-transform duration-300 ${
              zoomMode ? "scale-125 cursor-zoom-out" : "cursor-zoom-in"
            }`}
            onClick={() => setZoomMode(!zoomMode)}
          >
            <img
              src={imageFailed ? FALLBACK_IMAGE : artwork.image_url}
              alt={artwork.title}
              className="max-h-[70vh] lg:max-h-[85vh] w-auto max-w-full object-contain rounded-lg shadow-2xl select-none"
              onError={() => {
                if (!imageFailed) setFailedImageId(artwork.id);
              }}
            />
          </div>

          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white/90 text-xs font-mono">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{zoomMode ? "Thu nhỏ (100%)" : "Nhấp ảnh để soi chi tiết"}</span>
          </div>

          {artwork.award && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/90 text-white text-xs font-semibold shadow-lg backdrop-blur-sm border border-amber-400/40">
              <Award className="w-4 h-4" />
              <span>{artwork.award}</span>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[420px] flex flex-col bg-slate-50/50 dark:bg-slate-900/50 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-6">
          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-2">
              <Badge className="border border-sky-300 text-sky-700 bg-sky-50 dark:bg-sky-950/40">
                {artwork.category}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {artwork.contest_name} • {artwork.year}
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {artwork.title}
            </h2>

            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Nhiếp ảnh gia: <span className="text-sky-600 font-semibold">{artwork.author_name}</span>
            </p>
          </div>

          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab("spec")}
              className={`pb-2.5 px-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "spec"
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Thông số cuộn phim & Lab
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("story")}
              className={`pb-2.5 px-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "story"
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Câu chuyện tác phẩm
            </button>
          </div>

          {activeTab === "spec" ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <Film className="w-4 h-4 text-sky-500" />
                  <span>Chất liệu & Định dạng phim</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Cuộn phim</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{artwork.film_stock || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Khổ phim (Format)</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{artwork.film_format || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Độ nhạy ISO</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{artwork.iso ?? "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Lab Scan</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{artwork.lab_scan || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <Camera className="w-4 h-4 text-sky-500" />
                  <span>Thiết bị ghi hình & Phơi sáng</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Thân máy</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{artwork.camera || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ống kính</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{artwork.lens || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tốc độ màn trập</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{artwork.shutter_speed || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Khẩu độ</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{artwork.aperture || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900 text-sky-800 dark:text-sky-300 text-[11px] leading-relaxed space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
                  <span>
                    {artwork.watermarked
                      ? "Bản hiển thị công khai đã được gắn watermark và bảo vệ bản quyền theo BR-17."
                      : "Thông tin bản quyền được lưu trữ theo quy định bảo vệ tác phẩm (BR-17)."}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Copyright className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
                  <span>{copyrightText}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{artwork.description || "Tác phẩm chưa có phần mô tả đi kèm."}"
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
                <h4 className="font-semibold flex items-center gap-1.5 mb-1 text-amber-800">
                  <Copyright className="w-4 h-4" />
                  Ghi chú bản quyền
                </h4>
                <p className="text-amber-700/90 leading-relaxed">{copyrightText}</p>
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Đóng cửa sổ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
