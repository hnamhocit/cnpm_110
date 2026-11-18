"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  Film,
  Info,
  Maximize2,
  Minimize2,
  RotateCw,
  Sliders,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { BlindEvaluationSubmission } from "@/types/judging";

interface HighResZoomViewerProps {
  submission: BlindEvaluationSubmission;
  showMetadataSidebar: boolean;
  onToggleSidebar: () => void;
}

export function HighResZoomViewer({
  submission,
  showMetadataSidebar,
  onToggleSidebar,
}: HighResZoomViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, max = 3.5 (350% soi grain)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative flex-1 h-full bg-slate-950 flex overflow-hidden select-none">
      {/* Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 relative flex items-center justify-center p-4 overflow-hidden ${
          zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        }`}
      >
        <div
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
          className="relative max-w-full max-h-full flex items-center justify-center origin-center"
        >
          <Image
            src={submission.imageOriginalUrl}
            alt={submission.title}
            width={2000}
            height={1500}
            priority
            className="max-h-[82vh] w-auto max-w-full object-contain rounded-md shadow-2xl pointer-events-none"
          />
        </div>

        {/* Floating Zoom Controls Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-2xl">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-semibold min-w-[50px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3.5}
            className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Phóng to soi hạt grain"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />

          <button
            type="button"
            onClick={handleResetZoom}
            className="p-2 rounded-xl hover:bg-white/10 text-xs font-mono transition-colors"
            title="Về kích thước chuẩn (100%)"
          >
            Reset
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />

          <button
            type="button"
            onClick={onToggleSidebar}
            className={`p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium ${
              showMetadataSidebar ? "bg-sky-600 text-white" : "hover:bg-white/10 text-slate-300"
            }`}
            title="Ẩn/Hiện Metadata kỹ thuật"
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline">Thông số</span>
          </button>
        </div>

        {/* Grain inspection hint */}
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-mono text-slate-300 border border-white/5">
          {zoomLevel > 1.5 ? "Đang phóng đại để soi cấu trúc hạt phim (Film Grain)" : "Chế độ xem toàn cảnh"}
        </div>
      </div>

      {/* Collapsible Metadata Sidebar (Cạnh ảnh) */}
      {showMetadataSidebar && (
        <aside className="w-72 sm:w-80 bg-slate-900 border-l border-white/10 p-5 overflow-y-auto space-y-5 text-white animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase tracking-wider mb-1">
              <Film className="w-3.5 h-3.5" />
              <span>Chất liệu phim</span>
            </div>
            <h4 className="text-sm font-semibold text-white">
              {submission.filmRoll.stock}
            </h4>
            <div className="mt-2 text-xs text-slate-400 space-y-1">
              <div>Khổ phim: <span className="text-white font-medium">{submission.filmRoll.format}</span></div>
              <div>Độ nhạy ISO: <span className="text-white font-medium">{submission.filmRoll.iso}</span></div>
              <div>Lab tráng scan: <span className="text-white font-medium">{submission.filmRoll.labScan || "Chưa cung cấp"}</span></div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase tracking-wider mb-1">
              <Camera className="w-3.5 h-3.5" />
              <span>Thiết bị phơi sáng</span>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div>Thân máy: <span className="text-white font-medium">{submission.cameraMetadata?.camera || "N/A"}</span></div>
              <div>Ống kính: <span className="text-white font-medium">{submission.cameraMetadata?.lens || "N/A"}</span></div>
              <div>Tốc độ: <span className="text-white font-medium">{submission.cameraMetadata?.shutterSpeed || "N/A"}</span></div>
              <div>Khẩu độ: <span className="text-white font-medium">{submission.cameraMetadata?.aperture || "N/A"}</span></div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
              <Info className="w-3.5 h-3.5" />
              <span>Tuân thủ BR-12 (Double-Blind)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mọi định danh cá nhân của thí sinh đã được bóc tách bảo mật. Giám khảo chấm điểm độc lập dựa hoàn toàn vào tác phẩm và chất lượng kỹ thuật analog.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}

