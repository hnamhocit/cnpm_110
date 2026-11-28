import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OfficialResultsView } from "@/components/results/official-results-view";

type ContestResultsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

export default async function ContestResultsPage({
  params,
  searchParams,
}: ContestResultsPageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const fromPortal = (Array.isArray(from) ? from[0] : from) === "portal";
  const backHref = fromPortal ? `/portal/contests/${id}` : `/contests/${id}`;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại cuộc thi
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Kết quả cuộc thi {id}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Bảng xếp hạng và giải thưởng được công bố chính thức.
        </p>
      </div>
      <OfficialResultsView contestId={id} />
    </main>
  );
}
