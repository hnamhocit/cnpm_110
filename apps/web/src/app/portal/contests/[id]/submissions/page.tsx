import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import SubmissionTable from "@/components/submission/submission-table";
import { Button } from "@/components/ui/button";

type ContestSubmissionsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ContestSubmissionsPage({
  params,
}: ContestSubmissionsPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Quản lý bài dự thi
          </h1>
          <p className="text-sm text-[var(--portal-muted)]">
            Duyệt và kiểm tra cảnh báo AI cho cuộc thi #{id}.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/portal/contests">
            <ArrowLeft />
            Quay lại
          </Link>
        </Button>
      </div>

      <SubmissionTable />
    </div>
  );
}
