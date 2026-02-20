import { cn } from "@/lib/utils"
import { Shield, AlertTriangle, Eye, Skull, Ban } from "lucide-react"
import type { RiskLabel } from "@/lib/pgx/types"

const RISK_CONFIG: Record<
  RiskLabel,
  { color: string; bg: string; border: string; icon: React.ElementType }
> = {
  Safe: {
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    icon: Shield,
  },
  "Adjust Dosage": {
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    icon: AlertTriangle,
  },
  "Monitor Closely": {
    color: "text-clinical",
    bg: "bg-clinical/10",
    border: "border-clinical/30",
    icon: Eye,
  },
  Toxic: {
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    icon: Skull,
  },
  Contraindicated: {
    color: "text-destructive",
    bg: "bg-destructive/15",
    border: "border-destructive/40",
    icon: Ban,
  },
}

interface RiskBadgeProps {
  riskLabel: RiskLabel
  size?: "sm" | "md" | "lg"
}

export function RiskBadge({ riskLabel, size = "md" }: RiskBadgeProps) {
  const config = RISK_CONFIG[riskLabel] || RISK_CONFIG["Monitor Closely"]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium",
        config.color,
        config.bg,
        config.border,
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        size === "lg" && "px-4 py-1.5 text-base"
      )}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4")} />
      {riskLabel}
    </span>
  )
}
