import { cn } from "cn";
import type * as React from "react";

type BadgeProps = React.ComponentProps<"span"> & {
  variant?: "default" | "ai-warning" | "valid" | "approved" | "disqualified";
};

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
