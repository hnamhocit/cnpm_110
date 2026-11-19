"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Có thể gắn logger hoặc Sentry tại đây
    console.error("Runtime Exception:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center py-12">
        <div className="relative mb-6">
          <div className="text-8xl sm:text-9xl font-black text-rose-100 dark:text-rose-950/60 select-none tracking-widest">
            500
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-rose-100 dark:border-rose-950/40 flex items-center justify-center text-rose-600">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
          Đã xảy ra sự cố kỹ thuật
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mb-8 max-w-sm mx-auto">
          Hệ thống đang gặp lỗi tạm thời khi tải tài nguyên này. Vui lòng thử tải lại hoặc quay lại trang chủ.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm transition-all"
          >
            Thử tải lại trang
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

