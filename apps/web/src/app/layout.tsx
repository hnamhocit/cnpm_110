import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://filmcontest.vn"
  ),
  title: {
    default: "CINEGEN — Nền tảng Cuộc thi Nhiếp ảnh Phim Tích hợp AI",
    template: "%s | CINEGEN",
  },
  description:
    "Nền tảng tổ chức và quản lý cuộc thi nhiếp ảnh phim tích hợp trí tuệ nhân tạo. Tự động kiểm định ảnh, chống trùng lặp và chấm điểm minh bạch.",
  keywords: [
    "CINEGEN",
    "film contest",
    "nhiếp ảnh phim",
    "analog photography",
    "cuộc thi ảnh phim",
    "film rolls",
    "film archive",
    "chấm thi ẩn danh",
  ],
  authors: [{ name: "CINEGEN Team" }],
  creator: "CINEGEN",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://filmcontest.vn",
    siteName: "CINEGEN",
    title: "CINEGEN — Nền tảng Cuộc thi Nhiếp ảnh Phim Tích hợp AI",
    description:
      "Tự động kiểm định ảnh âm bản, chấm thi ẩn danh độc lập và lưu trữ di sản số ảnh phim chất lượng cao.",
    images: [
      {
        url: "/brand/cinegen-social.png",
        width: 1200,
        height: 630,
        alt: "Logo CINEGEN",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CINEGEN — Nền tảng Cuộc thi Nhiếp ảnh Phim Tích hợp AI",
    description:
      "Nền tảng tổ chức và quản lý cuộc thi nhiếp ảnh phim tích hợp trí tuệ nhân tạo.",
    images: ["/brand/cinegen-social.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${beVietnamPro.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
