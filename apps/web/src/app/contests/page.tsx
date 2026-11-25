import type { Metadata } from "next";
import { Footer } from "@/components/home/footer";
import { Navbar } from "@/components/home/navbar";
import { OngoingContests } from "@/components/home/ongoing-contests";

export const metadata: Metadata = {
  title: "Danh sách cuộc thi | CINEGEN",
  description:
    "Khám phá các cuộc thi nhiếp ảnh phim analog đang diễn ra. Tham gia gửi bài dự thi, chấm điểm minh bạch và triển lãm ảnh nghệ thuật.",
  openGraph: {
    title: "Danh sách Cuộc thi Nhiếp ảnh Phim | CINEGEN",
    description:
      "Nền tảng thi ảnh phim tích hợp kiểm định ảnh âm bản và chấm thi ẩn danh.",
    type: "website",
  },
};

export default function ContestsListPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-canvas text-slate-900 selection:bg-brand-solid selection:text-white font-sans">
      <Navbar />
      <main className="flex-1 pb-16">
        <OngoingContests />
      </main>
      <Footer />
    </div>
  );
}

