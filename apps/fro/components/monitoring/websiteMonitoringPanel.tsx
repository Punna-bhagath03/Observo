"use client"

import axios from "axios"
import { useCallback, useEffect, useState } from "react"

import MetricsChart from "@/components/monitoring/metricsChart"
import MonitorSummaryCards from "@/components/monitoring/monitorSummaryCards"
import PeriodStatsTable from "@/components/monitoring/periodStatsTable"
import StatusBadge from "@/components/shared/statusBadge"
import MonitoringPanelSkeleton from "@/components/shared/skeletons/monitoringPanelSkeleton"
import { getAuthToken } from "@/hooks/useAuthToken"
import {
  CHECK_INTERVAL_MINUTES,
  defaultCustomRange,
  parseCustomRangeDates,
  PRESET_RANGES,
  type PeriodStatRow,
  type PresetRange,
  type WebsiteMetrics,
} from "@/lib/metrics"
import { BACKEND_URL } from "@/lib/utils"

type WebsiteMonitoringPanelProps = {
  websiteId: string
  regionId: string
  regionName: string
  refreshKey?: number
  onMonitorChange?: (monitor: WebsiteMetrics["monitor"]) => void
}

export default function WebsiteMonitoringPanel({
  websiteId,
  regionId,
  regionName,
  refreshKey = 0,
  onMonitorChange,
}: WebsiteMonitoringPanelProps) {
  const [metrics, setMetrics] = useState<WebsiteMetrics | null>(null)
  const [selectedRange, setSelectedRange] = useState<PresetRange>("hour")
  const [customFrom, setCustomFrom] = useState(defaultCustomRange().from)
  const [customTo, setCustomTo] = useState(defaultCustomRange().to)
  const [calculatedRow, setCalculatedRow] = useState<PeriodStatRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPresetMetrics = useCallback(
    async (range: PresetRange, options?: { silent?: boolean }) => {
      const token = getAuthToken()
      if (!token) {
        return
      }

      setError(null)
      if (!options?.silent) {
        setLoading(true)
      }

      try {
        const response = await axios.get<WebsiteMetrics>(
          `${BACKEND_URL}/status/${websiteId}/metrics?regionId=${regionId}&range=${range}`,
          { headers: { Authorization: token } }
        )

        setMetrics(response.data)
        setCalculatedRow(null)
        onMonitorChange?.(response.data.monitor)
      } catch (err) {
        console.error(err)
        if (!options?.silent) {
          setError("Could not load monitoring data. Please try again.")
        }
      } finally {
        if (!options?.silent) {
          setLoading(false)
        }
      }
    },
    [onMonitorChange, regionId, websiteId]
  )

  const calculateCustomPeriod = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      return
    }

    const parsed = parseCustomRangeDates(customFrom, customTo)
    if ("error" in parsed) {
      setError(parsed.error)
      return
    }

    setError(null)
    setCalculating(true)

    try {
      const response = await axios.get<{ periodStat: PeriodStatRow }>(
        `${BACKEND_URL}/status/${websiteId}/metrics?regionId=${regionId}&statsOnly=true&from=${encodeURIComponent(parsed.from.toISOString())}&to=${encodeURIComponent(parsed.to.toISOString())}`,
        { headers: { Authorization: token } }
      )

      setCalculatedRow(response.data.periodStat)
    } catch (err) {
      console.error(err)
      setError("Could not calculate custom range metrics.")
    } finally {
      setCalculating(false)
    }
  }, [customFrom, customTo, regionId, websiteId])

  useEffect(() => {
    setMetrics(null)
    setCalculatedRow(null)
    setError(null)
  }, [regionId])

  useEffect(() => {
    fetchPresetMetrics(selectedRange)
  }, [fetchPresetMetrics, selectedRange, refreshKey])

  useEffect(() => {
    const intervalMs = CHECK_INTERVAL_MINUTES * 60_000
    const intervalId = window.setInterval(() => {
      void fetchPresetMetrics(selectedRange, { silent: true })
    }, intervalMs)

    return () => window.clearInterval(intervalId)
  }, [fetchPresetMetrics, selectedRange])

  const monitor = metrics?.monitor
  const periodRows = metrics?.periodStats ?? []

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Monitoring</h2>
            <p className="text-xs text-gray-400">
              Response time and availability from {regionName}.
            </p>
          </div>
          {monitor ? <StatusBadge status={monitor.status} /> : null}
        </div>
      </div>

      {error ? (
        <div className="mx-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !metrics ? (
        <MonitoringPanelSkeleton />
      ) : monitor ? (
        <>
          <div className="px-4">
            <MonitorSummaryCards monitor={monitor} />
          </div>

          <div className="px-4">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {PRESET_RANGES.map((range) => {
                const active = selectedRange === range.id
                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setSelectedRange(range.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
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
                <MonitoringPanelSkeleton chartOnly />
              ) : (
                <MetricsChart
                  graph={metrics.graph}
                  monitorStatus={monitor.status}
                  lastCheckedAt={monitor.lastCheckedAt}
                  regionName={regionName}
                />
              )
            ) : null}
          </div>

          {periodRows.length > 0 ? (
            <div>
              <div className="border-b border-white/5 px-4 py-3">
                <h3 className="text-xs font-semibold text-white">
                  Period statistics
                </h3>
                <p className="text-[12px] text-gray-400">
                  Availability is computed from incident downtime.
                </p>
              </div>
              <PeriodStatsTable
                rows={periodRows}
                calculatedRow={calculatedRow}
                customFrom={customFrom}
                customTo={customTo}
                calculating={calculating}
                onFromChange={setCustomFrom}
                onToChange={setCustomTo}
                onCalculate={calculateCustomPeriod}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
