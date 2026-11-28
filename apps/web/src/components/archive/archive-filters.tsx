"use client";

import { Award, RotateCcw, Search } from "lucide-react";
import type { ArchiveFilterState } from "@/types/archive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ArchiveFiltersProps {
  filters: ArchiveFilterState;
  onChange: (newFilters: ArchiveFilterState) => void;
  onReset: () => void;
}

export function ArchiveFilters({
  filters,
  onChange,
  onReset,
}: ArchiveFiltersProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
          placeholder="Tìm tác phẩm, tác giả, cuộc thi, loại phim, máy ảnh..."
          className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-sky-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Cuộc thi (ID)
          </label>
          <Input
            type="text"
            value={filters.contestId ?? ""}
            onChange={(e) => onChange({ ...filters, contestId: e.target.value })}
            placeholder="Contest ID"
            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Năm tổ chức
          </label>
          <select
            value={filters.year}
            onChange={(e) => onChange({ ...filters, year: e.target.value })}
            className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Tất cả các năm</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Film Stock (Loại phim)
          </label>
          <select
            value={filters.filmStock}
            onChange={(e) => onChange({ ...filters, filmStock: e.target.value })}
            className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Tất cả Film Stock</option>
            <option value="Portra">Kodak Portra</option>
            <option value="Tri-X">Kodak Tri-X</option>
            <option value="Ektar">Kodak Ektar</option>
            <option value="Superia">Fujifilm Superia</option>
            <option value="Pro 400H">Fujifilm Pro 400H</option>
            <option value="Ilford">Ilford HP5 Plus (B&W)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Khổ phim (Format)
          </label>
          <select
            value={filters.filmFormat}
            onChange={(e) => onChange({ ...filters, filmFormat: e.target.value })}
            className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Tất cả định dạng</option>
            <option value="35mm">35mm (135)</option>
            <option value="120">120 (Medium Format)</option>
            <option value="Large Format">Large Format (4x5)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Máy ảnh
          </label>
          <Input
            type="text"
            value={filters.camera ?? ""}
            onChange={(e) => onChange({ ...filters, camera: e.target.value })}
            placeholder="VD: Leica M6"
            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            AI tag
          </label>
          <Input
            type="text"
            value={filters.aiTag ?? ""}
            onChange={(e) => onChange({ ...filters, aiTag: e.target.value })}
            placeholder="VD: street"
            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs font-medium"
          />
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
          <button
            type="button"
            onClick={() => onChange({ ...filters, awardOnly: !filters.awardOnly })}
            className={`flex-1 h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              filters.awardOnly
                ? "bg-amber-50 border-amber-300 text-amber-800 shadow-sm"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Award className={`w-3.5 h-3.5 ${filters.awardOnly ? "text-amber-600" : "text-slate-400"}`} />
            <span>Chỉ tác phẩm đạt giải</span>
          </button>

          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="h-10 px-3 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
