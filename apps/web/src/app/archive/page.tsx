import type { Metadata } from "next";
import { Footer } from "@/components/home/footer";
import { Navbar } from "@/components/home/navbar";
import { ArchiveClientView } from "@/components/archive/archive-client-view";

export const metadata: Metadata = {
  title: "Triển lãm số (Digital Archive) | CINEGEN",
  description:
    "Thưởng lãm các tác phẩm nhiếp ảnh phim đoạt giải cao với chất lượng phân giải cao, thông số cuộn phim, lab scan và đánh giá của ban giám khảo.",
  openGraph: {
    title: "Triển Lãm Số Di Sản Ảnh Phim | CINEGEN",
    description:
      "Lưu trữ nghệ thuật ảnh phim analog, tra cứu theo Film Stock, khổ phim 35mm/120 và năm tổ chức.",
    type: "website",
  },
};

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ contestId?: string }>;
}) {
  const { contestId } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7ff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-sky-600 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <ArchiveClientView initialContestId={contestId} />
      </main>
      <Footer />
    </div>
  );
}
