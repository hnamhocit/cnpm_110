import type { Submission } from "@/types/submission";

export function filterSubmissions(
  submissions: Submission[],
  searchQuery: string,
): Submission[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return submissions;

  return submissions.filter((s) =>
    (s.authorName ?? "").toLowerCase().includes(query),
  );
}
