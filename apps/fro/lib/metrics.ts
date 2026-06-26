export type {
  GraphData,
  GraphPoint,
  MetricsRange,
  MonitorSummary,
  PeriodStatRow,
  WebsiteMetrics,
} from "store/metrics"

export const PRESET_RANGES = [
  { id: "hour" as const, label: "Hour" },
  { id: "day" as const, label: "Day" },
  { id: "week" as const, label: "Week" },
  { id: "month" as const, label: "Month" },
]

export type PresetRange = (typeof PRESET_RANGES)[number]["id"]

export function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function defaultCustomRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to.getTime() - 24 * 60 * 60_000)
  return {
    from: toDateTimeLocalValue(from),
    to: toDateTimeLocalValue(to),
  }
}
