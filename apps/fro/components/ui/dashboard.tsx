"use client"

import axios from "axios"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"


import { BACKEND_URL, getSelectedRegionId, setSelectedRegionId } from "@/lib/utils"

import AddWebsiteModal from "./addWebsiteModal"
import { OngoingOutageBadge } from "./incidentsList"
import RegionSelect, { type Region } from "./regionSelect"

type WebsiteTick = {
  status: "Up" | "Down" | "Unknown"
  response_time_ms: number
  createdAt: string
}

type Website = {
  id: string
  url: string
  user_id: string
  time_added: string
  ticks?: WebsiteTick[]
  stats: WebsiteStats
  ongoingIncident: boolean
}

type WebsiteStats = {
  uptimePercentage: number
  avgResponseTimeMs: number
  failures: number
  totalChecks: number
  lastOutageAt: string | null
}

type WebsitesResponse = {
  websites: Website[]
}

type RegionsResponse = {
  regions: Region[]
}

function getStatus(website: Website): "Up" | "Down" | "checking" {
  const latest = website.ticks?.[0]
  if (!latest || latest.status === "Unknown") return "checking"
  return latest.status
}

type DashboardPageProps = {
  onSignOut: () => void
}

export default function DashboardPage({ onSignOut }: DashboardPageProps) {
  const router = useRouter()
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [regions, setRegions] = useState<Region[]>([])
  const [selectedRegionId, setSelectedRegionIdState] = useState<string | null>(
    null
  )

  const fetchWebsites = useCallback(
    async (options?: { refresh?: boolean }) => {
      if (!selectedRegionId) {
        return
      }

      setError(null)
      if (options?.refresh) {
        setRefreshing(true)
      }

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null

      if (!token) {
        setLoading(false)
        setRefreshing(false)
        router.push("/signin")
        return
      }

      try {
        const res = await axios.get<WebsitesResponse>(
          `${BACKEND_URL}/websites?regionId=${selectedRegionId}`,
          {
            headers: { Authorization: token },
          }
        )
        setWebsites(res.data.websites ?? [])
      } catch (err) {
        console.error(err)
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          localStorage.removeItem("token")
          setLoading(false)
          setRefreshing(false)
          router.push("/signin")
          return
        }
        setError("Could not load your websites. Please try again.")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [router, selectedRegionId]
  )

  useEffect(() => {
    axios
      .get<RegionsResponse>(`${BACKEND_URL}/regions`)
      .then((res) => {
        const list = res.data.regions ?? []
        setRegions(list)

        const saved = getSelectedRegionId()
        const isValid = saved && list.some((region) => region.id === saved)
        const india = list.find((region) => region.name === "India")
        const regionId = isValid ? saved! : india?.id ?? list[0]?.id ?? null

        if (regionId) {
          setSelectedRegionIdState(regionId)
          if (!isValid) {
            setSelectedRegionId(regionId)
          }
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error(err)
        setError("Could not load regions. Please try again.")
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (selectedRegionId) {
      fetchWebsites()
    }
  }, [fetchWebsites, selectedRegionId])

  function handleRegionChange(regionId: string) {
    setSelectedRegionId(regionId)
    setSelectedRegionIdState(regionId)
  }

  const selectedRegionName =
    regions.find((region) => region.id === selectedRegionId)?.name ?? "India"

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -z-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
      />

      <header className="relative border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold">Observo</span>
          </a>

          <button
            type="button"
            onClick={onSignOut}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Websites</h1>
            <p className="mt-2 text-sm text-gray-400">
              {loading
                ? "Loading your monitored endpoints..."
                : `${websites.length} ${websites.length === 1 ? "endpoint" : "endpoints"} monitored from ${selectedRegionName}.`}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <RegionSelect
              regions={regions}
              value={selectedRegionId ?? ""}
              onChange={handleRegionChange}
              disabled={loading || refreshing || regions.length === 0}
            />
            <button
              type="button"
              onClick={() => fetchWebsites({ refresh: true })}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Spinner
                className={`h-4 w-4 text-cyan-400 ${refreshing ? "" : "hidden"}`}
              />
              <svg
                className={`h-4 w-4 ${refreshing ? "hidden" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:from-cyan-400 hover:to-blue-500"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add website
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchWebsites} />
          ) : websites.length === 0 ? (
            <EmptyState onAdd={() => setIsModalOpen(true)} />
          ) : (
            <WebsitesTable websites={websites} />
          )}
        </div>
      </main>

      <AddWebsiteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdded={fetchWebsites}
      />
    </div>
  )
}

function WebsitesTable({ websites }: { websites: Website[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
            <th className="px-6 py-4">Website</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Availability (24h)</th>
            <th className="px-6 py-4">Response time</th>
            <th className="px-6 py-4">Last checked</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {websites.map((website) => {
            const status = getStatus(website)
            const responseTime = website.ticks?.[0]?.response_time_ms
            const lastChecked = website.ticks?.[0]?.createdAt
            return (
              <tr
                key={website.id}
                className="border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.02]"
              >
                <td className="px-6 py-4">
                  <a
                    href={website.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-white transition-colors hover:text-cyan-400"
                  >
                    {website.url}
                  </a>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={status} />
                    {website.ongoingIncident ? <OngoingOutageBadge /> : null}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {website.stats.totalChecks > 0
                    ? `${website.stats.uptimePercentage}%`
                    : "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {typeof responseTime === "number" ? `${responseTime} ms` : "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {lastChecked ? new Date(lastChecked).toLocaleTimeString() : "—"}
                </td>
                <td className="px-6 py-4">
                  <a
                    href={`/website/${website.id}`}
                    aria-label="View website details"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: "Up" | "Down" | "checking" }) {
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
      {status === "checking" ? (
        <Spinner className="h-3 w-3 text-yellow-400" />
      ) : (
        <span
          className={`h-2 w-2 rounded-full ${styles.dot} ${styles.pulse ? "animate-pulse" : ""}`}
        />
      )}
      {styles.label}
    </span>
  )
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className ?? "h-4 w-4"}`} fill="none" viewBox="0 0 24 24">
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

function LoadingState() {
  return (
    <div className="flex items-center justify-center px-6 py-20 text-sm text-gray-400">
      <Spinner className="mr-3 h-5 w-5 text-cyan-400" />
      Loading websites...
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
        <svg
          className="h-6 w-6 text-cyan-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">
        No websites yet
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-400">
        Add your first endpoint to start tracking its uptime, latency, and
        incidents.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:from-cyan-400 hover:to-blue-500"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add your first website
      </button>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
        <svg
          className="h-6 w-6 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">
        Something went wrong
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10"
      >
        Try again
      </button>
    </div>
  )
}
