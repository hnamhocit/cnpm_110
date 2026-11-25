import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground",
        brand: "bg-brand-soft text-brand-solid border border-brand-glow/60",
        "ai-warning":
          "bg-amber-500/10 text-amber-600 border border-amber-500/20",
        valid:
          "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
        approved: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
        disqualified:
          "bg-destructive/10 text-destructive border border-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
