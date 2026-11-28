"use client";

import { Award, Camera, Eye, Film } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { ArchiveArtwork } from "@/types/archive";

const FALLBACK_IMAGE =
  "https://placehold.co/800x540/0f172a/e2e8f0?text=No+image";

interface MasonryGridProps {
  artworks: ArchiveArtwork[];
  onSelectArtwork: (artwork: ArchiveArtwork) => void;
}

export function MasonryGrid({ artworks, onSelectArtwork }: MasonryGridProps) {
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
      {artworks.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelectArtwork(item)}
          className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          {/* Image */}
          <div className="relative w-full overflow-hidden">
            <Image
              src={failedIds.has(item.id) ? FALLBACK_IMAGE : item.image_url}
              alt={item.title}
              width={800}
              height={item.aspect_ratio === "portrait" ? 1100 : item.aspect_ratio === "square" ? 800 : 540}
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              unoptimized
              onError={() =>
                setFailedIds((previous) => {
                  if (previous.has(item.id)) return previous;
                  const next = new Set(previous);
                  next.add(item.id);
                  return next;
                })
              }
            />
          </div>

          {/* Top Overlays: Award badge */}
          {item.award && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 text-white text-[11px] font-bold shadow-md backdrop-blur-md border border-amber-300/40">
              <Award className="w-3.5 h-3.5" />
              <span>{item.award}</span>
            </div>
          )}

          {/* Format indicator */}
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/60 text-white/90 text-[10px] font-mono tracking-wider backdrop-blur-md">
            {item.film_format}
          </div>

          {/* Bottom Gradient Hover Info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 sm:p-5 text-white">
            <div className="transform sm:translate-y-2 sm:group-hover:translate-y-0 transition-transform duration-300 space-y-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-sky-400 uppercase">
                {item.category}
              </span>
              <h3 className="text-base font-bold text-white leading-snug line-clamp-1">
                {item.title}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                bởi <span className="text-white font-semibold">{item.author_name}</span>
              </p>

              <div className="pt-2 flex items-center justify-between border-t border-white/20 text-[11px] text-slate-300 font-mono">
                <span className="flex items-center gap-1">
                  <Film className="w-3 h-3 text-sky-400" />
                  {item.film_stock}
                </span>
                <span className="flex items-center gap-1 text-white font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                  <Eye className="w-3 h-3" /> Chi tiết
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

