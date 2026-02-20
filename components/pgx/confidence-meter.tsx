import { cn } from "@/lib/utils"

interface ConfidenceMeterProps {
  score: number
}

export function ConfidenceMeter({ score }: ConfidenceMeterProps) {
  const pct = Math.round(score * 100)

  const getColor = (s: number) => {
    if (s >= 0.8) return "bg-success"
    if (s >= 0.5) return "bg-warning"
    return "bg-destructive"
  }

  const getLabel = (s: number) => {
    if (s >= 0.8) return "High"
    if (s >= 0.5) return "Moderate"
    return "Low"
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Confidence</span>
        <span className="text-xs font-mono font-semibold text-foreground">
          {pct}% ({getLabel(score)})
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getColor(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
