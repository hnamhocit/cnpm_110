"use client";

import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Film,
  Sparkles,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useAuthStore } from "@/lib/stores/auth-store";

type CategoryItem = {
  id: string;
  name: string;
  description?: string;
};

type ContestCtaButtonProps = {
  contestId: string;
  contestName: string;
};

export function ContestCtaButton({
  contestId,
  contestName,
}: ContestCtaButtonProps) {
  const user = useCurrentUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filmBrand, setFilmBrand] = useState("Kodak");
  const [filmStock, setFilmStock] = useState("Portra 400");
  const [filmFormat, setFilmFormat] = useState("135");
  const [isoRated, setIsoRated] = useState("400");
  const [isoShot, setIsoShot] = useState("400");
  const [cameraBody, setCameraBody] = useState("Leica M6");
  const [lens, setLens] = useState("Summicron 35mm f/2");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Fetch categories when modal opens
  useEffect(() => {
    if (!isModalOpen) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    fetch(`${apiUrl}/api/v1/contests/${contestId}/categories`)
      .then((r) => r.json())
      .then((data) => {
        const items = data?.data || [];
        setCategories(items);
        if (items.length > 0 && !categoryId) {
          setCategoryId(items[0].id);
        }
      })
      .catch(() => {});
  }, [isModalOpen, contestId, categoryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!imageFile) {
      setError("Vui lòng chọn file ảnh tác phẩm chụp bằng phim (JPEG/TIFF).");
      return;
    }

    if (!categoryId) {
      setError("Vui lòng chọn bảng thi / hạng mục.");
      return;
    }

    if (!title.trim()) {
      setError("Vui lòng nhập tên tác phẩm.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("contestId", contestId);
      formData.append("categoryId", categoryId);
      formData.append("title", title.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }
      formData.append("filmBrand", filmBrand);
      formData.append("filmStock", filmStock);
      formData.append("filmFormat", filmFormat);
      formData.append("isoRated", isoRated);
      formData.append("isoShot", isoShot);
      formData.append("cameraBody", cameraBody);
      if (lens.trim()) {
        formData.append("lens", lens.trim());
      }
      formData.append("image", imageFile);

      const token = useAuthStore.getState().accessToken;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

      const res = await fetch(`${apiUrl}/api/v1/submissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          resData?.message || resData?.error || `Lỗi nộp bài: ${res.status}`,
        );
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể nộp bài. Vui lòng kiểm tra lại định dạng file hoặc kết nối mạng!",
      );
    } finally {
      setLoading(false);
    }
  }

  // Trường hợp chưa đăng nhập
  if (!user) {
    return (
      <div className="space-y-3">
        <a
          href="#registration-guide"
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-brand-solid hover:bg-brand-hover text-white font-bold text-sm shadow-md shadow-brand-solid/30 transition-all"
        >
          <Upload className="h-4 w-4" />
          <span>Xem hướng dẫn nộp bài</span>
        </a>
        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors shadow-sm"
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>Đăng nhập nộp tác phẩm</span>
        </Link>
      </div>
    );
  }

  // Trường hợp Organizer / Admin
  if (user.role === "Organizer" || user.role === "Admin") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
          <p className="font-semibold">
            Bạn đang đăng nhập vai trò {user.role}
          </p>
          <p className="text-[11px] text-blue-600 mt-0.5">
            Truy cập Portal để quản lý bài nộp và điều phối cuộc thi.
          </p>
        </div>
        <Link
          href={`/portal/contests/${contestId}`}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-brand-solid hover:bg-brand-hover text-white font-bold text-sm shadow-md shadow-brand-solid/30 transition-all"
        >
          <span>Vào Quản trị Cuộc thi</span>
        </Link>
      </div>
    );
  }

  // Trường hợp Thí sinh (Participant) đã đăng nhập
  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setSuccess(false);
            setError(null);
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-brand-solid hover:bg-brand-hover text-white font-bold text-sm shadow-md shadow-brand-solid/30 transition-all active:scale-95"
        >
          <Camera className="h-4 w-4" />
          <span>Nộp bài dự thi ngay (Web)</span>
        </button>

        <a
          href="#registration-guide"
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors shadow-sm"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Xem hướng dẫn &amp; Thể lệ</span>
        </a>
      </div>

      {/* Submission Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {success ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Nộp bài thi thành công!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Tác phẩm{" "}
                  <span className="font-semibold text-slate-900">
                    "{title}"
                  </span>{" "}
                  đã được tiếp nhận. Hệ thống kiểm tra ảnh tạo sinh và ảnh tương
                  tự để hỗ trợ Ban tổ chức thẩm định.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      window.location.reload();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-brand-solid text-white font-semibold text-sm hover:bg-brand-hover transition"
                  >
                    Hoàn tất
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
                    <Film className="h-3.5 w-3.5" />
                    <span>Nộp tác phẩm Analog</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Gửi bài dự thi
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Cuộc thi:{" "}
                    <span className="font-medium text-slate-700">
                      {contestName}
                    </span>
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hạng mục / Bảng thi{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                      className="w-full h-11 px-3 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên tác phẩm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: Nắng Sớm Phố Cổ"
                      required
                      className="w-full h-11 px-3 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mô tả / Câu chuyện tác phẩm
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Kể về khoảnh khắc bấm máy, góc chụp hoặc cảm xúc của bạn..."
                      rows={2}
                      className="w-full p-3 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 5 Siêu dữ liệu phim BR-22 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      Thông số kỹ thuật phim (Chuẩn BR-22)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-600 mb-1">
                          Hãng phim
                        </label>
                        <input
                          type="text"
                          value={filmBrand}
                          onChange={(e) => setFilmBrand(e.target.value)}
                          className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">
                          Loại cuộn phim
                        </label>
                        <input
                          type="text"
                          value={filmStock}
                          onChange={(e) => setFilmStock(e.target.value)}
                          className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">
                          Khổ phim
                        </label>
                        <select
                          value={filmFormat}
                          onChange={(e) => setFilmFormat(e.target.value)}
                          className="w-full h-9 px-2 text-xs rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="135">135 (35mm)</option>
                          <option value="120_645">120 (6x4.5)</option>
                          <option value="120_66">120 (6x6)</option>
                          <option value="120_67">120 (6x7)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">
                          ISO chụp
                        </label>
                        <input
                          type="number"
                          value={isoShot}
                          onChange={(e) => setIsoShot(e.target.value)}
                          className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">
                          Thân máy ảnh
                        </label>
                        <input
                          type="text"
                          value={cameraBody}
                          onChange={(e) => setCameraBody(e.target.value)}
                          className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">
                          Ống kính (Lens)
                        </label>
                        <input
                          type="text"
                          value={lens}
                          onChange={(e) => setLens(e.target.value)}
                          className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tải file ảnh scan dự thi (JPEG / TIFF tối thiểu 2000px
                      theo BR-07) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/tiff"
                      required
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setImageFile(file);
                      }}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-brand-solid hover:bg-brand-hover text-white text-xs font-bold shadow-md shadow-brand-solid/30 transition disabled:opacity-50"
                  >
                    {loading
                      ? "Đang tải lên & thẩm định..."
                      : "Nộp bài dự thi ngay"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
