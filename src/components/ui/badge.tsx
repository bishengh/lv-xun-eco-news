import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'emerald' | 'gold' | 'outline' | 'source'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants: Record<string, string> = {
      default: 'tag-primary',
      primary: 'tag-primary',
      emerald: 'tag-emerald',
      gold: 'tag-gold',
      outline: 'tag border border-border text-muted-foreground',
      source: 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/8 text-primary border border-primary/15',
    }
    return (
      <span
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }