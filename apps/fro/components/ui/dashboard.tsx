"use client"

import axios from "axios"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import StatusPageControls from "@/components/shared/statusPageControls"
import RegionToolbar from "@/components/shared/regionToolbar"
import ClickableTableRow from "@/components/shared/clickableTableRow"
import { ErrorState } from "@/components/shared/pageStates"
import ListPageSkeleton from "@/components/shared/skeletons/listPageSkeleton"
import Spinner from "@/components/shared/spinner"
import StatusBadge from "@/components/shared/statusBadge"
import { requireAuthToken } from "@/hooks/useAuthToken"
import { useRegions } from "@/hooks/useRegions"
import { websiteIncidentsHref } from "@/lib/routes"
import { BACKEND_URL } from "@/lib/utils"

import AddWebsiteModal from "./addWebsiteModal"
import AppShell from "./appShell"
import { OngoingOutageBadge } from "./incidentsList"

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
  status_page_enabled: boolean
  status_page_slug: string | null
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
  const {
    regions,
    selectedRegionId,
    selectedRegionName,
    loadingRegions,
    regionError,
    setSelectedRegionId,
  } = useRegions()
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchWebsites = useCallback(
    async (options?: { refresh?: boolean }) => {
      if (!selectedRegionId) {
        return
      }

      const token = requireAuthToken(router)
      if (!token) {
        setLoading(false)
        setRefreshing(false)
        return
      }

      setError(null)
      if (options?.refresh) {
        setRefreshing(true)
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
    if (selectedRegionId) {
      fetchWebsites()
    }
  }, [fetchWebsites, selectedRegionId])

  const isLoading = loadingRegions || (loading && !selectedRegionId)
  const displayError = regionError ?? error

  return (
    <AppShell onSignOut={onSignOut}>
      {isLoading ? (
        <ListPageSkeleton columns={6} rows={6} actionCount={2} />
      ) : (
        <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Websites</h1>
            <p className="mt-1.5 text-xs text-gray-400">
              {`${websites.length} ${websites.length === 1 ? "endpoint" : "endpoints"} monitored from ${selectedRegionName}.`}
            </p>
          </div>

          {selectedRegionId ? (
            <RegionToolbar
              regions={regions}
              selectedRegionId={selectedRegionId}
              onRegionChange={setSelectedRegionId}
              disabled={isLoading || refreshing || regions.length === 0}
            >
              <button
                type="button"
                onClick={() => fetchWebsites({ refresh: true })}
                disabled={isLoading || refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-medium text-white transition-all hover:from-cyan-400 hover:to-blue-500"
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
            </RegionToolbar>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
          {displayError ? (
            <ErrorState message={displayError} onRetry={fetchWebsites} />
          ) : websites.length === 0 ? (
            <EmptyState onAdd={() => setIsModalOpen(true)} />
          ) : (
            <WebsitesTable websites={websites} />
          )}
        </div>

      <AddWebsiteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdded={fetchWebsites}
      />
        </>
      )}
    </AppShell>
  )
}

function WebsitesTable({ websites }: { websites: Website[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
            <th className="px-4 py-3">Website</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Availability (24h)</th>
            <th className="px-4 py-3">Response time</th>
            <th className="px-4 py-3">Last checked</th>
            <th className="px-4 py-3">Status page</th>
          </tr>
        </thead>
        <tbody>
          {websites.map((website) => {
            const status = getStatus(website)
            const responseTime = website.ticks?.[0]?.response_time_ms
            const lastChecked = website.ticks?.[0]?.createdAt
            return (
              <ClickableTableRow
                key={website.id}
                href={websiteIncidentsHref(website.id)}
              >
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-white">
                    {website.url}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={status} />
                    {website.ongoingIncident ? <OngoingOutageBadge /> : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-300">
                  {website.stats.totalChecks > 0
                    ? `${website.stats.uptimePercentage}%`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-300">
                  {typeof responseTime === "number" ? `${responseTime} ms` : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {lastChecked ? new Date(lastChecked).toLocaleTimeString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusPageControls
                    websiteId={website.id}
                    enabled={website.status_page_enabled}
                    slug={website.status_page_slug}
                  />
                </td>
              </ClickableTableRow>
            )
          })}
        </tbody>
      </table>
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

