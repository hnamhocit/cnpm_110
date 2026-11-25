import { Badge } from "@/components/ui/badge";
import { SCOREBOARD_STATUS_LABELS } from "@/lib/scoreboard";
import type { ScoreboardStatus } from "@/types/scoreboard";

const STATUS_STYLES: Record<ScoreboardStatus, string> = {
  COMPLETE: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  JUDGING: "border border-amber-200 bg-amber-50 text-amber-700",
};

export function ScoreboardStatusBadge({
  status,
}: {
  status: ScoreboardStatus;
}) {
  return (
    <Badge className={STATUS_STYLES[status]}>
      {SCOREBOARD_STATUS_LABELS[status]}
    </Badge>
  );
}
