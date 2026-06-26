"use client"

import axios from "axios"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import AppShell from "@/components/ui/appShell"
import { OngoingOutageBadge } from "@/components/ui/incidentsList"
import RegionToolbar from "@/components/shared/regionToolbar"
import ClickableTableRow from "@/components/shared/clickableTableRow"
import { ErrorState } from "@/components/shared/pageStates"
import ListPageSkeleton from "@/components/shared/skeletons/listPageSkeleton"
import StatusBadge from "@/components/shared/statusBadge"
import { requireAuthToken } from "@/hooks/useAuthToken"
import { useRegions } from "@/hooks/useRegions"
import { websiteIncidentsHref } from "@/lib/routes"
import { BACKEND_URL } from "@/lib/utils"

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
  stats: {
    uptimePercentage: number
    avgResponseTimeMs: number
    failures: number
    totalChecks: number
    lastOutageAt: string | null
  }
  ongoingIncident: boolean
}

function getStatus(website: Website): "Up" | "Down" | "checking" {
  const latest = website.ticks?.[0]
  if (!latest || latest.status === "Unknown") return "checking"
  return latest.status
}

type IncidentsOverviewPageProps = {
  onSignOut: () => void
}

export default function IncidentsOverviewPage({
  onSignOut,
}: IncidentsOverviewPageProps) {
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
        const res = await axios.get<{ websites: Website[] }>(
          `${BACKEND_URL}/websites?regionId=${selectedRegionId}`,
          { headers: { Authorization: token } }
        )
        setWebsites(res.data.websites ?? [])
      } catch (err) {
        console.error(err)
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          localStorage.removeItem("token")
          router.push("/signin")
          return
        }
        setError("Could not load incidents. Please try again.")
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

  const sortedWebsites = useMemo(
    () =>
      [...websites].sort((a, b) => {
        if (a.ongoingIncident !== b.ongoingIncident) {
          return a.ongoingIncident ? -1 : 1
        }
        return a.url.localeCompare(b.url)
      }),
    [websites]
  )

  const ongoingCount = websites.filter((website) => website.ongoingIncident).length
  const isLoading = loadingRegions || (loading && !selectedRegionId)
  const displayError = regionError ?? error

  return (
    <AppShell onSignOut={onSignOut}>
      {isLoading ? (
        <ListPageSkeleton columns={4} rows={6} actionCount={1} />
      ) : (
        <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Incidents</h1>
          <p className="mt-1.5 text-xs text-gray-400">
            {`${ongoingCount} ongoing ${ongoingCount === 1 ? "incident" : "incidents"} across ${websites.length} ${websites.length === 1 ? "website" : "websites"} in ${selectedRegionName}.`}
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
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh
            </button>
          </RegionToolbar>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
        {displayError ? (
          <ErrorState message={displayError} onRetry={fetchWebsites} />
        ) : websites.length === 0 ? (
          <div className="px-6 py-16 text-center text-xs text-gray-400">
            No websites yet. Add a website from the dashboard to start tracking
            incidents.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
                  <th className="px-4 py-3">Website</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Incident</th>
                  <th className="px-4 py-3">Last outage</th>
                </tr>
              </thead>
              <tbody>
                {sortedWebsites.map((website) => {
                  const status = getStatus(website)
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
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3">
                        {website.ongoingIncident ? (
                          <OngoingOutageBadge />
                        ) : (
                          <span className="text-xs text-gray-500">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {website.stats.lastOutageAt
                          ? new Date(website.stats.lastOutageAt).toLocaleString()
                          : "—"}
                      </td>
                    </ClickableTableRow>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}
    </AppShell>
  )
}
