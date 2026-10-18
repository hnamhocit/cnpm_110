import { FeaturesSection } from "@/components/home/features-section";
import { Footer } from "@/components/home/footer";
import { HeroSection } from "@/components/home/hero-section";
import { Navbar } from "@/components/home/navbar";
import { OngoingContests } from "@/components/home/ongoing-contests";

export const metadata = {
  title: "Film Contest — Nền tảng Cuộc thi Nhiếp ảnh Phim Tích hợp AI",
  description:
    "Nền tảng tổ chức và quản lý cuộc thi nhiếp ảnh phim tích hợp trí tuệ nhân tạo. Tự động kiểm định ảnh, chống trùng lặp và chấm điểm minh bạch.",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#111416] text-white selection:bg-amber-400 selection:text-black">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <OngoingContests />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
