import type { Contest } from "@/types/contest";

export function filterContests(
  contests: Contest[],
  searchQuery: string,
  statusFilter: "all" | "ongoing" | "published" = "all",
): Contest[] {
  const query = searchQuery.trim().toLowerCase();
  return contests.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) {
      return false;
    }
    if (!query) return true;
    const matchesName = c.name.toLowerCase().includes(query);
    const matchesDesc = (c.description ?? "").toLowerCase().includes(query);
    const matchesCat = (c.category ?? "").toLowerCase().includes(query);
    return matchesName || matchesDesc || matchesCat;
  });
}

export function formatContestDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}
