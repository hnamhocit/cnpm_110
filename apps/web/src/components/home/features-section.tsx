import { Award, Camera, CheckCircle2, Cpu, Sparkles } from "lucide-react";

export function FeaturesSection() {
  return (
    <section
      id="ai-features"
      className="py-20 bg-slate-50 border-b border-slate-200 text-slate-900"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
            <Sparkles className="h-4 w-4" />
            <span>Công nghệ tiên phong</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Trí tuệ Nhân tạo phục vụ Nhiếp ảnh Phim
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            Hệ thống kết hợp giữa công nghệ AI hiện đại và các chuẩn mực nhiếp
            ảnh phim truyền thống nhằm tạo ra một sân chơi công bằng, minh bạch
            nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              AI Phát hiện Ảnh Trùng &amp; AI-Generated
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tự động phân tích cấu trúc hạt phim (film grain) và chữ ký số để
              phát hiện tác phẩm do Midjourney, DALL-E tạo ra hoặc ảnh sao chép
              trái phép.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Kiểm định độ chân thực của hạt phim
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                So khớp dữ liệu chống nộp trùng lặp
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Camera className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Quản lý Thông số Cuộn Phim &amp; Máy ảnh
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Mỗi tác phẩm lưu trữ đầy đủ metadata: Thân máy (Body), Ống kính
              (Lens), Loại phim, ISO chụp và phòng lab tráng scan.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Hỗ trợ format 135 (35mm), 120, Large Format
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Minh bạch nguồn gốc từng thước phim
              </li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Chấm điểm Hội đồng &amp; Công bố Minh bạch
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cổng chấm thi dành riêng cho Giám khảo với các tiêu chí chuyên
              biệt: Bố cục, Màu sắc, Ý nghĩa thông điệp và Kỹ thuật phơi sáng.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Chấm điểm ẩn danh (Blind judging)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Bảng xếp hạng cập nhật thời gian thực
              </li>
            </ul>
          </div>
        </div>

        {/* How It Works Section */}
        <div
          id="how-it-works"
          className="mt-20 pt-16 border-t border-slate-200"
        >
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-2xl font-bold text-slate-900">
              Quy trình 3 Bước Tham gia Đơn giản
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Dành cho mọi nhiếp ảnh gia đam mê chụp ảnh phim
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold mb-4 shadow-md shadow-blue-600/30">
                1
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">
                Chọn Cuộc thi &amp; Đăng ký
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Khám phá các cuộc thi đang mở nhận ảnh trên trang chủ và tạo tài
                khoản thí sinh nhanh chóng.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold mb-4 shadow-md shadow-blue-600/30">
                2
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">
                Tải ảnh scan &amp; Điền thông số
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tải lên bản scan chất lượng cao từ lab tráng và nhập các thông
                số máy ảnh, cuộn phim của bạn.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold mb-4 shadow-md shadow-blue-600/30">
                3
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">
                AI Xác thực &amp; Giám khảo Chấm
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tác phẩm được hệ thống AI kiểm định hợp lệ và chuyển đến hội
                đồng giám khảo chấm điểm công tâm.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
