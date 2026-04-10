import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/shared/lib/utils"
import { scaleTap } from "@/shared/ui/motion/variants"

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-md)] border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  // Only apply interactions if onClick is passed, making it an interactive badge
  if (props.onClick) {
    return (
      <motion.div
        className={cn(badgeVariants({ variant }), className, "cursor-pointer")}
        variants={scaleTap}
        whileHover="hover"
        whileTap="tap"
        {...(props as any)}
      />
    )
  }

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
