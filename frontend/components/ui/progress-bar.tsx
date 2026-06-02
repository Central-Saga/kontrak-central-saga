import { cn } from "@/lib/utils"

type ProgressBarVariant =
  | "not_started"
  | "in_progress"
  | "on_hold"
  | "delayed"
  | "completed"
  | "default"

type ProgressBarProps = {
  value: number
  variant?: ProgressBarVariant
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  label?: string
  className?: string
  showInlinePercent?: boolean
}

const variantClassNames: Record<ProgressBarVariant, string> = {
  not_started: "bg-muted-foreground/40",
  in_progress: "bg-primary",
  on_hold: "bg-yellow-500",
  delayed: "bg-destructive",
  completed: "bg-emerald-500",
  default: "bg-primary",
}

const sizeClassNames: Record<NonNullable<ProgressBarProps["size"]>, string> = {
  sm: "h-2",
  md: "h-3.5",
  lg: "h-6",
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) {
    return 0
  }

  if (value < 0) {
    return 0
  }

  if (value > 100) {
    return 100
  }

  return value
}

export function ProgressBar({
  value,
  variant = "default",
  showLabel = true,
  size = "md",
  label,
  className,
  showInlinePercent,
}: ProgressBarProps) {
  const percent = clampPercent(value)
  const fillVariant = percent >= 100 ? "completed" : variant
  const inlinePercent = showInlinePercent ?? size === "lg"
  const showInlineText = inlinePercent && size === "lg" && percent >= 18

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {showLabel ? (
        <div className="flex items-center justify-between text-xs font-medium text-foreground">
          <span className="text-muted">{label ?? "Progres"}</span>
          <span className="font-mono">{Math.round(percent)}%</span>
        </div>
      ) : null}

      <div
        aria-label={label ?? "Progres"}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(percent)}
        className={cn(
          "relative w-full overflow-hidden rounded-full border border-line bg-muted/10",
          sizeClassNames[size],
        )}
        role="progressbar"
      >
        <div
          className={cn(
            "flex h-full items-center justify-end rounded-full pr-2 text-[10px] font-semibold text-white transition-[width] duration-700 ease-out",
            variantClassNames[fillVariant],
          )}
          style={{ width: `${percent}%` }}
        >
          {showInlineText ? <span className="font-mono">{Math.round(percent)}%</span> : null}
        </div>
      </div>
    </div>
  )
}
