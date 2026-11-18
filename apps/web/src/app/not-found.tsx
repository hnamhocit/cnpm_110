import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center py-12">
        <div className="relative mb-6">
          <div className="text-8xl sm:text-9xl font-black text-sky-100 dark:text-sky-950/60 select-none tracking-widest">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-sky-600">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
          Không tìm thấy trang yêu cầu
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mb-8 max-w-sm mx-auto">
          Cuộn phim hoặc đường dẫn bạn đang tìm kiếm có thể đã bị di chuyển, đổi tên hoặc không tồn tại trên hệ thống.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-sm transition-all">
              Về trang chủ
            </Button>
          </Link>
          <Link href="/contests" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              Xem các cuộc thi
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

