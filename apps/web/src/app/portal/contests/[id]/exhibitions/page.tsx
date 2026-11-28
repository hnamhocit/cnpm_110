import { notFound } from "next/navigation";
import { ContestExhibitionManager } from "@/components/exhibition/contest-exhibition-manager";
import { API_INTERNAL_URL } from "@/lib/server-api";

type ContestExhibitionPageProps = {
  params: Promise<{ id: string }>;
};

type ContestData = {
  id: string;
  name: string;
  status: string;
};

async function getContest(id: string): Promise<ContestData | null> {
  try {
    const res = await fetch(`${API_INTERNAL_URL}/api/v1/contests/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as ContestData;
  } catch {
    return null;
  }
}

export default async function PortalContestExhibitionsPage({
  params,
}: ContestExhibitionPageProps) {
  const { id } = await params;
  const contest = await getContest(id);

  if (!contest) {
    notFound();
  }

  return (
    <ContestExhibitionManager
      contestId={contest.id}
      contestName={contest.name}
      status={contest.status}
    />
  );
}
