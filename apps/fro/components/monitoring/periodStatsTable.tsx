import type { PeriodStatRow } from "@/lib/metrics"
import {
  formatDuration,
  formatPeriodAvailability,
} from "@/lib/utils"
import { Skeleton } from "@/components/shared/skeleton"

type PeriodStatsTableProps = {
  rows: PeriodStatRow[]
  calculatedRow?: PeriodStatRow | null
  customFrom: string
  customTo: string
  calculating?: boolean
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onCalculate: () => void
}

function formatPeriodDuration(ms: number | null): string {
  if (ms === null || ms <= 0) {
    return "none"
  }
  return formatDuration(ms)
}

function PeriodStatCells({
  row,
  highlighted = false,
}: {
  row: PeriodStatRow
  highlighted?: boolean
}) {
  return (
    <>
      <td
        className={`px-4 py-3 text-xs font-medium ${highlighted ? "text-white" : "text-gray-200"}`}
      >
        {row.label}
      </td>
      <td className="px-4 py-3 text-xs font-semibold text-white">
        {formatPeriodAvailability(row.availability)}
      </td>
      <td className="px-4 py-3 text-xs text-gray-300">
        {formatPeriodDuration(row.downtimeMs)}
      </td>
      <td className="px-4 py-3 text-xs text-gray-300">{row.incidents}</td>
      <td className="px-4 py-3 text-xs text-gray-300">
        {formatPeriodDuration(row.longestIncidentMs)}
      </td>
      <td className="px-4 py-3 text-xs text-gray-300">
        {formatPeriodDuration(row.avgIncidentMs)}
      </td>
    </>
  )
}

export default function PeriodStatsTable({
  rows,
  calculatedRow,
  customFrom,
  customTo,
  calculating = false,
  onFromChange,
  onToChange,
  onCalculate,
}: PeriodStatsTableProps) {
  if (rows.length === 0) {
    return null
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-white/5 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
            <th className="px-4 py-3">Time period</th>
            <th className="px-4 py-3">Availability</th>
            <th className="px-4 py-3">Downtime</th>
            <th className="px-4 py-3">Incidents</th>
            <th className="px-4 py-3">Longest incident</th>
            <th className="px-4 py-3">Avg. incident</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-white/5">
              <PeriodStatCells row={row} />
            </tr>
          ))}

          <tr className="border-b border-white/5">
            <td className="px-4 py-3" colSpan={6}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="shrink-0">From</span>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(event) => onFromChange(event.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500/40"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="shrink-0">To</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(event) => onToChange(event.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500/40"
                  />
                </label>
                <button
                  type="button"
                  onClick={onCalculate}
                  disabled={calculating}
                  className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {calculating ? (
                    <Skeleton className="h-3.5 w-16 rounded bg-white/20" />
                  ) : (
                    "Calculate"
                  )}
                </button>
              </div>
            </td>
          </tr>

          {calculatedRow ? (
            <tr className="border-b border-white/5 bg-cyan-500/5 last:border-b-0">
              <PeriodStatCells row={calculatedRow} highlighted />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
