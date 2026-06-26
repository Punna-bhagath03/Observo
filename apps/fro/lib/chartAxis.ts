import type { MetricsRange } from "@/lib/metrics"

const MINUTE_S = 60
const HOUR_S = 60 * MINUTE_S
const DAY_S = 24 * HOUR_S

export function getXAxisLabelSpace(chartWidth: number): number {
  return Math.max(72, Math.floor(chartWidth / 7))
}

export function getXAxisIncrements(range: MetricsRange): number[] {
  switch (range) {
    case "hour":
      return [5 * MINUTE_S, 10 * MINUTE_S, 15 * MINUTE_S, 30 * MINUTE_S, HOUR_S]
    case "day":
      return [HOUR_S, 2 * HOUR_S, 3 * HOUR_S, 6 * HOUR_S, 12 * HOUR_S]
    case "week":
      return [DAY_S, 2 * DAY_S, 3 * DAY_S, 7 * DAY_S]
    case "month":
      return [DAY_S, 2 * DAY_S, 7 * DAY_S, 14 * DAY_S]
    default:
      return [
        HOUR_S,
        6 * HOUR_S,
        12 * HOUR_S,
        DAY_S,
        7 * DAY_S,
      ]
  }
}

function formatHourLabel(timestampSeconds: number): string {
  const date = new Date(timestampSeconds * 1000)
  const hours = date.getHours()
  const hour12 = hours % 12 || 12
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  const meridiem = hours >= 12 ? "pm" : "am"
  return `${hour12}:${minutes}:${seconds}${meridiem}`
}

function formatDayLabel(timestampSeconds: number): string {
  return new Date(timestampSeconds * 1000).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatWeekLabel(timestampSeconds: number): string {
  return new Date(timestampSeconds * 1000).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

function formatMonthLabel(timestampSeconds: number): string {
  return new Date(timestampSeconds * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

function formatCustomLabel(timestampSeconds: number, spanMs: number): string {
  if (spanMs <= 2 * DAY_S * 1000) {
    return formatDayLabel(timestampSeconds)
  }

  if (spanMs <= 14 * DAY_S * 1000) {
    return formatWeekLabel(timestampSeconds)
  }

  return formatMonthLabel(timestampSeconds)
}

export function formatXAxisLabel(
  timestampSeconds: number,
  range: MetricsRange,
  spanMs: number
): string {
  switch (range) {
    case "hour":
      return formatHourLabel(timestampSeconds)
    case "day":
      return formatDayLabel(timestampSeconds)
    case "week":
      return formatWeekLabel(timestampSeconds)
    case "month":
      return formatMonthLabel(timestampSeconds)
    default:
      return formatCustomLabel(timestampSeconds, spanMs)
  }
}

export function formatChartRangeLabel(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}
