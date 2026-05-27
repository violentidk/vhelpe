import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        warning: "border-transparent bg-amber-500/20 text-amber-700 dark:text-amber-300",
        success: "border-transparent bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
        danger: "border-transparent bg-red-500/20 text-red-700 dark:text-red-300",
        outline: "border-border text-card-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
