type MonitorStatus = "Up" | "Down" | "checking"

const styles: Record<
  MonitorStatus,
  { dot: string; pulse: boolean; pill: string; label: string }
> = {
  Up: {
    dot: "bg-green-400",
    pulse: true,
    pill: "border-green-500/30 bg-green-500/10 text-green-300",
    label: "Up",
  },
  Down: {
    dot: "bg-red-500",
    pulse: false,
    pill: "border-red-500/30 bg-red-500/10 text-red-300",
    label: "Down",
  },
  checking: {
    dot: "bg-yellow-500",
    pulse: false,
    pill: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    label: "Checking",
  },
}

export default function StatusBadge({ status }: { status: MonitorStatus }) {
  const style = styles[status]

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${style.pill}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${style.dot} ${style.pulse ? "animate-pulse" : ""}`}
      />
      {style.label}
    </span>
  )
}
