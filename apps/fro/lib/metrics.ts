export type {
  GraphData,
  GraphPoint,
  MetricsRange,
  MonitorSummary,
  PeriodStatRow,
  WebsiteMetrics,
} from "store/metrics"

export { CHECK_INTERVAL_MINUTES } from "store/metrics"

export const PRESET_RANGES = [
  { id: "hour" as const, label: "Hour" },
  { id: "day" as const, label: "Day" },
  { id: "week" as const, label: "Week" },
  { id: "month" as const, label: "Month" },
]

export type PresetRange = (typeof PRESET_RANGES)[number]["id"]

export function toDateInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function defaultCustomRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60_000)
  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
  }
}

export function parseCustomRangeDates(
  fromValue: string,
  toValue: string
): { from: Date; to: Date } | { error: string } {
  const fromDay = new Date(`${fromValue}T00:00:00`)
  const toDay = new Date(`${toValue}T00:00:00`)

  if (Number.isNaN(fromDay.getTime()) || Number.isNaN(toDay.getTime())) {
    return { error: "Enter valid from and to dates." }
  }

  const now = new Date()
  const toIsToday =
    toDay.getFullYear() === now.getFullYear() &&
    toDay.getMonth() === now.getMonth() &&
    toDay.getDate() === now.getDate()

  const to = toIsToday
    ? now
    : new Date(toDay.getTime() + 24 * 60 * 60_000 - 1)

  if (fromDay.getTime() >= to.getTime()) {
    return { error: "From must be before to." }
  }

  return { from: fromDay, to }
}
