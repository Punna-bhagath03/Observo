"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import uPlot from "uplot"
import "uplot/dist/uPlot.min.css"

import type { GraphData, MonitorSummary } from "@/lib/metrics"
import {
  formatChartRangeLabel,
  formatXAxisLabel,
  getXAxisIncrements,
  getXAxisLabelSpace,
} from "@/lib/chartAxis"

type MetricsChartProps = {
  graph: GraphData
  monitorStatus?: MonitorSummary["status"]
}

const CHART_HEIGHT = 260

const COLORS = {
  response: "#22d3ee",
  up: "#4ade80",
  down: "#f87171",
} as const

type ChartSeries = {
  timestamps: number[]
  avgMs: (number | null)[]
  availabilityUp: (number | null)[]
  availabilityDown: (number | null)[]
}

function buildChartSeries(graph: GraphData): ChartSeries {
  const timestamps = graph.points.map((point) => point.t / 1000)
  const avgMs = graph.points.map((point) => point.avgMs)
  const availabilityUp = graph.points.map((point) => {
    if (point.availability === null || point.availability === 0) {
      return null
    }
    return point.availability
  })
  const availabilityDown = graph.points.map((point) => {
    if (point.availability === null) {
      return null
    }
    if (point.availability === 0) {
      return 0
    }
    return null
  })

  return { timestamps, avgMs, availabilityUp, availabilityDown }
}

function hasChartData(series: ChartSeries): boolean {
  return (
    series.avgMs.some((value) => value !== null) ||
    series.availabilityUp.some((value) => value !== null) ||
    series.availabilityDown.some((value) => value !== null)
  )
}

function responseAxisRange(
  _self: uPlot,
  dataMin: number,
  dataMax: number
): uPlot.Range.MinMax {
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) {
    return [0, 1000]
  }

  if (dataMin === dataMax) {
    const padding = Math.max(dataMax * 0.2, 50)
    return [Math.max(0, dataMin - padding), dataMax + padding]
  }

  return [Math.max(0, dataMin * 0.9), dataMax * 1.1]
}

export default function MetricsChart({
  graph,
  monitorStatus = "checking",
}: MetricsChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<uPlot | null>(null)
  const [width, setWidth] = useState(0)
  const series = useMemo(() => buildChartSeries(graph), [graph])
  const showChart = hasChartData(series)
  const spanMs = useMemo(
    () => new Date(graph.to).getTime() - new Date(graph.from).getTime(),
    [graph.from, graph.to]
  )

  useEffect(() => {
    if (!showChart) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.floor(entries[0]?.contentRect.width ?? 0)
      if (nextWidth > 0) {
        setWidth(nextWidth)
      }
    })

    observer.observe(container)
    setWidth(Math.floor(container.clientWidth))

    return () => observer.disconnect()
  }, [showChart])

  useEffect(() => {
    const container = containerRef.current
    if (!container || width <= 0 || !showChart) {
      plotRef.current?.destroy()
      plotRef.current = null
      return
    }

    plotRef.current?.destroy()

    const data: uPlot.AlignedData = [
      series.timestamps,
      series.avgMs,
      series.availabilityUp,
      series.availabilityDown,
    ]

    const labelSpace = getXAxisLabelSpace(width)

    const plot = new uPlot(
      {
        width,
        height: CHART_HEIGHT,
        padding: [12, 8, 8, 0],
        cursor: {
          drag: { x: false, y: false },
        },
        legend: {
          show: true,
          live: false,
        },
        scales: {
          x: { time: true },
          y: { auto: true, range: responseAxisRange },
          y2: { range: [0, 100] },
        },
        axes: [
          {
            stroke: "#6b7280",
            grid: { stroke: "rgba(255,255,255,0.06)" },
            ticks: { stroke: "rgba(255,255,255,0.12)" },
            font: "11px system-ui, sans-serif",
            gap: 6,
            size: 46,
            space: labelSpace,
            incrs: getXAxisIncrements(graph.range),
            values: (_self, ticks) =>
              ticks.map((tick) =>
                formatXAxisLabel(tick, graph.range, spanMs)
              ),
          },
          {
            stroke: "#6b7280",
            grid: { stroke: "rgba(255,255,255,0.06)" },
            ticks: { stroke: "rgba(255,255,255,0.12)" },
            font: "11px system-ui, sans-serif",
            label: "Response (ms)",
            labelSize: 11,
            labelGap: 6,
            size: 44,
            gap: 4,
          },
          {
            stroke: "#6b7280",
            side: 1,
            scale: "y2",
            grid: { show: false },
            ticks: { stroke: "rgba(255,255,255,0.12)" },
            font: "11px system-ui, sans-serif",
            label: "Availability (%)",
            labelSize: 11,
            labelGap: 6,
            size: 44,
            gap: 4,
          },
        ],
        series: [
          {},
          {
            label: "Avg response",
            stroke: COLORS.response,
            width: 2,
            spanGaps: true,
            points: { show: false },
          },
          {
            label: "Up",
            stroke: COLORS.up,
            width: 2,
            scale: "y2",
            spanGaps: true,
            points: { show: false },
          },
          {
            label: "Down",
            stroke: COLORS.down,
            width: 2,
            scale: "y2",
            spanGaps: true,
            points: { show: false },
          },
        ],
      },
      data,
      container
    )

    plotRef.current = plot

    return () => {
      plot.destroy()
      plotRef.current = null
    }
  }, [graph.range, series, showChart, spanMs, width])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <span>
          {formatChartRangeLabel(graph.from)} –{" "}
          {formatChartRangeLabel(graph.to)}
        </span>
        <span>Bucket size: {formatBucketMs(graph.bucketMs)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-0.5 text-[12px] text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: COLORS.response }}
          />
          Response time
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: COLORS.up }}
          />
          Up at 100%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: COLORS.down }}
          />
          Down at 0%
        </span>
      </div>

      {showChart ? (
        <div
          ref={containerRef}
          className="w-full overflow-hidden rounded-xl border border-white/5 bg-black/20"
        />
      ) : (
        <EmptyChartState monitorStatus={monitorStatus} />
      )}
    </div>
  )
}

function EmptyChartState({
  monitorStatus,
}: {
  monitorStatus: MonitorSummary["status"]
}) {
  const message =
    monitorStatus === "checking"
      ? "No checks recorded in this time range yet. The worker will populate the graph after the first probes."
      : "No check data in this time range. Try a wider range like Week or Month, or wait for more checks."

  return (
    <div className="flex h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 px-4 text-center">
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="h-2 w-8 rounded-full"
            style={{ backgroundColor: COLORS.up }}
          />
          Up
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="h-2 w-8 rounded-full"
            style={{ backgroundColor: COLORS.down }}
          />
          Down
        </span>
      </div>
      <p className="max-w-md text-xs text-gray-400">{message}</p>
    </div>
  )
}

function formatBucketMs(bucketMs: number): string {
  if (bucketMs < 60_000) {
    return `${Math.round(bucketMs / 1000)}s`
  }

  if (bucketMs < 3_600_000) {
    return `${Math.round(bucketMs / 60_000)}m`
  }

  return `${Math.round(bucketMs / 3_600_000)}h`
}
