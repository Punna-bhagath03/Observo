"use client"

import axios from "axios"
import { useCallback, useEffect, useState } from "react"

import MetricsChart from "@/components/ui/metricsChart"
import {
  defaultCustomRange,
  PRESET_RANGES,
  type PeriodStatRow,
  type PresetRange,
  type WebsiteMetrics,
} from "@/lib/metrics"
import {
  BACKEND_URL,
  formatAvailability,
  formatDuration,
  formatTimelineDate,
} from "@/lib/utils"

type WebsiteMetricsPanelProps = {
  websiteId: string
  regionId: string
  regionName: string
  refreshKey?: number
  onMonitorChange?: (monitor: WebsiteMetrics["monitor"]) => void
}

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  return localStorage.getItem("token")
}

function formatPeriodDuration(ms: number | null): string {
  if (ms === null || ms <= 0) {
    return "—"
  }
  return formatDuration(ms)
}

function PeriodStatsTable({
  rows,
  highlightLabel,
}: {
  rows: PeriodStatRow[]
  highlightLabel?: string | null
}) {
  if (rows.length === 0) {
    return null
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="border-b border-white/5 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
            <th className="px-6 py-4">Period</th>
            <th className="px-6 py-4">Availability</th>
            <th className="px-6 py-4">Downtime</th>
            <th className="px-6 py-4">Incidents</th>
            <th className="px-6 py-4">Longest</th>
            <th className="px-6 py-4">Avg incident</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const highlighted = highlightLabel === row.label
            return (
              <tr
                key={row.label}
                className={`border-b border-white/5 last:border-b-0 ${
                  highlighted ? "bg-cyan-500/5" : ""
                }`}
              >
                <td className="px-6 py-4 text-sm font-medium text-white">
                  {row.label}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {formatAvailability(row.availability)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {formatPeriodDuration(row.downtimeMs)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {row.incidents}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {formatPeriodDuration(row.longestIncidentMs)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {formatPeriodDuration(row.avgIncidentMs)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MonitorCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
      <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  )
}

function StatusBadge({ status }: { status: WebsiteMetrics["monitor"]["status"] }) {
  const styles = {
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
  }[status]

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${styles.pill}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${styles.dot} ${styles.pulse ? "animate-pulse" : ""}`}
      />
      {styles.label}
    </span>
  )
}

export default function WebsiteMetricsPanel({
  websiteId,
  regionId,
  regionName,
  refreshKey = 0,
  onMonitorChange,
}: WebsiteMetricsPanelProps) {
  const [metrics, setMetrics] = useState<WebsiteMetrics | null>(null)
  const [selectedRange, setSelectedRange] = useState<PresetRange>("day")
  const [customMode, setCustomMode] = useState(false)
  const [customFrom, setCustomFrom] = useState(defaultCustomRange().from)
  const [customTo, setCustomTo] = useState(defaultCustomRange().to)
  const [customStats, setCustomStats] = useState<PeriodStatRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPresetMetrics = useCallback(
    async (range: PresetRange) => {
      const token = getToken()
      if (!token) {
        return
      }

      setError(null)
      setLoading(true)

      try {
        const response = await axios.get<WebsiteMetrics>(
          `${BACKEND_URL}/status/${websiteId}/metrics?regionId=${regionId}&range=${range}`,
          { headers: { Authorization: token } }
        )

        setMetrics(response.data)
        setCustomMode(false)
        setCustomStats(null)
        onMonitorChange?.(response.data.monitor)
      } catch (err) {
        console.error(err)
        setError("Could not load metrics. Please try again.")
      } finally {
        setLoading(false)
      }
    },
    [onMonitorChange, regionId, websiteId]
  )

  const fetchCustomMetrics = useCallback(async () => {
    const token = getToken()
    if (!token) {
      return
    }

    const from = new Date(customFrom)
    const to = new Date(customTo)

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      setError("Enter valid from and to dates.")
      return
    }

    if (from.getTime() >= to.getTime()) {
      setError("From must be before to.")
      return
    }

    setError(null)
    setCalculating(true)

    try {
      const response = await axios.get<WebsiteMetrics>(
        `${BACKEND_URL}/status/${websiteId}/metrics?regionId=${regionId}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
        { headers: { Authorization: token } }
      )

      setMetrics((current) =>
        current
          ? {
              ...response.data,
              periodStats: current.periodStats,
            }
          : response.data
      )
      setCustomMode(true)
      setCustomStats(response.data.customStats)
      onMonitorChange?.(response.data.monitor)
    } catch (err) {
      console.error(err)
      setError("Could not calculate custom range metrics.")
    } finally {
      setCalculating(false)
    }
  }, [customFrom, customTo, onMonitorChange, regionId, websiteId])

  useEffect(() => {
    fetchPresetMetrics(selectedRange)
  }, [fetchPresetMetrics, selectedRange, refreshKey])

  const monitor = metrics?.monitor
  const periodRows = metrics?.periodStats ?? []
  const tableRows =
    customStats && customMode ? [...periodRows, customStats] : periodRows

  return (
    <div className="space-y-8">
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Metrics</h2>
            <p className="text-xs text-gray-400">
              Response time and availability from {regionName}.
            </p>
          </div>
          {monitor ? <StatusBadge status={monitor.status} /> : null}
        </div>
      </div>

      {error ? (
        <div className="mx-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !metrics ? (
        <div className="flex items-center justify-center px-6 py-16 text-sm text-gray-400">
          <Spinner className="mr-3 h-5 w-5 text-cyan-400" />
          Loading metrics...
        </div>
      ) : monitor ? (
        <>
          <div className="grid grid-cols-1 gap-4 px-6 sm:grid-cols-2 xl:grid-cols-4">
            <MonitorCard
              label="Currently up for"
              value={
                monitor.status === "Up" && monitor.upForMs !== null
                  ? formatDuration(monitor.upForMs)
                  : monitor.status === "Down"
                    ? "Down"
                    : "—"
              }
            />
            <MonitorCard
              label="Last checked"
              value={
                monitor.lastCheckedAt
                  ? formatTimelineDate(monitor.lastCheckedAt)
                  : "—"
              }
            />
            <MonitorCard
              label="Incidents"
              value={String(monitor.incidentCount)}
              hint="All time for this region"
            />
            <MonitorCard
              label="Check interval"
              value={`${monitor.checkIntervalMinutes} min`}
            />
          </div>

          <div className="px-6">
            <div className="mb-4 flex flex-wrap gap-2">
              {PRESET_RANGES.map((range) => {
                const active = !customMode && selectedRange === range.id
                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setSelectedRange(range.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30"
                        : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {range.label}
                  </button>
                )
              })}
            </div>

            {metrics?.graph ? (
              loading ? (
                <div className="flex h-[280px] items-center justify-center rounded-xl border border-white/5 bg-black/20 text-sm text-gray-400">
                  <Spinner className="mr-2 h-4 w-4 text-cyan-400" />
                  Updating chart...
                </div>
              ) : (
                <MetricsChart
                  graph={metrics.graph}
                  monitorStatus={monitor.status}
                />
              )
            ) : null}
          </div>

          <div className="px-6">
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white">
                  Custom range
                </h3>
                <p className="text-xs text-gray-400">
                  Calculate availability and downtime for any window.
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <label className="flex flex-1 flex-col gap-1 text-xs text-gray-400">
                  From
                  <input
                    type="datetime-local"
                    value={customFrom}
                    onChange={(event) => setCustomFrom(event.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40"
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-xs text-gray-400">
                  To
                  <input
                    type="datetime-local"
                    value={customTo}
                    onChange={(event) => setCustomTo(event.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40"
                  />
                </label>
                <button
                  type="button"
                  onClick={fetchCustomMetrics}
                  disabled={calculating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {calculating ? (
                    <Spinner className="h-4 w-4 text-white" />
                  ) : null}
                  Calculate
                </button>
              </div>
            </div>
          </div>

          {tableRows.length > 0 ? (
            <div>
              <div className="border-b border-white/5 px-6 py-4">
                <h3 className="text-sm font-semibold text-white">
                  Period statistics
                </h3>
                <p className="text-xs text-gray-400">
                  Availability is computed from incident downtime.
                </p>
              </div>
              <PeriodStatsTable
                rows={tableRows}
                highlightLabel={customStats?.label ?? null}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? "h-4 w-4"}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}
