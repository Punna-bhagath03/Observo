"use client"

import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import AppShell from "@/components/ui/appShell"
import IncidentsList, { type Incident } from "@/components/ui/incidentsList"
import IncidentTimeline, {
  type TimelineEvent,
} from "@/components/ui/incidentTimeline"
import RegionToolbar from "@/components/shared/regionToolbar"
import WebsiteSummaryCard from "@/components/shared/websiteSummaryCard"
import { ErrorState } from "@/components/shared/pageStates"
import WebsiteIncidentsPageSkeleton from "@/components/shared/skeletons/websiteIncidentsPageSkeleton"
import { requireAuthToken, useSignOut } from "@/hooks/useAuthToken"
import { useRegions } from "@/hooks/useRegions"
import { BACKEND_URL } from "@/lib/utils"

type WebsiteDetail = {
  id: string
  url: string
  ticks: { status: "Up" | "Down" | "Unknown" }[]
}

export default function WebsiteIncidentsPage() {
  const router = useRouter()
  const params = useParams()
  const websiteId = params.websiteId as string
  const handleSignOut = useSignOut()
  const {
    regions,
    selectedRegionId,
    selectedRegionName,
    loadingRegions,
    regionError,
    setSelectedRegionId,
  } = useRegions()

  const [website, setWebsite] = useState<WebsiteDetail | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [incidentActionLoading, setIncidentActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWebsite = useCallback(async () => {
    if (!selectedRegionId) {
      return
    }

    const token = requireAuthToken(router)
    if (!token) {
      return
    }

    setError(null)

    try {
      const [statusRes, incidentsRes, timelineRes] = await Promise.all([
        axios.get<{ website: WebsiteDetail }>(
          `${BACKEND_URL}/status/${websiteId}?regionId=${selectedRegionId}`,
          { headers: { Authorization: token } }
        ),
        axios.get<{ incidents: Incident[] }>(
          `${BACKEND_URL}/status/${websiteId}/incidents?regionId=${selectedRegionId}`,
          { headers: { Authorization: token } }
        ),
        axios.get<{ events: TimelineEvent[] }>(
          `${BACKEND_URL}/status/${websiteId}/timeline?regionId=${selectedRegionId}`,
          { headers: { Authorization: token } }
        ),
      ])

      setWebsite(statusRes.data.website)
      setIncidents(incidentsRes.data.incidents ?? [])
      setTimeline(timelineRes.data.events ?? [])
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
    }
  }, [router, selectedRegionId, websiteId])

  async function runIncidentAction(path: string) {
    const token = requireAuthToken(router)
    if (!token) {
      return
    }

    setIncidentActionLoading(true)

    try {
      await axios.post(`${BACKEND_URL}${path}`, null, {
        headers: { Authorization: token },
      })
      await fetchWebsite()
    } catch (err) {
      console.error(err)
      setError("Could not update the incident. Please try again.")
    } finally {
      setIncidentActionLoading(false)
    }
  }

  function handleAcknowledge(incidentId: string) {
    runIncidentAction(
      `/status/${websiteId}/incidents/${incidentId}/acknowledge`
    )
  }

  function handleResolve(incidentId: string) {
    runIncidentAction(`/status/${websiteId}/incidents/${incidentId}/resolve`)
  }

  useEffect(() => {
    if (selectedRegionId) {
      setLoading(true)
      fetchWebsite()
    }
  }, [fetchWebsite, selectedRegionId])

  const latestTick = website?.ticks?.[0]
  const overallStatus =
    !latestTick || latestTick.status === "Unknown"
      ? "checking"
      : latestTick.status
  const isLoading = loadingRegions || (loading && Boolean(selectedRegionId))
  const displayError = regionError ?? error

  return (
    <AppShell onSignOut={handleSignOut}>
      {isLoading ? (
        <WebsiteIncidentsPageSkeleton />
      ) : displayError ? (
        <ErrorState message={displayError} onRetry={fetchWebsite} />
      ) : website && selectedRegionId ? (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Incidents</h1>
              <p className="mt-1 text-xs text-gray-400">{website.url}</p>
            </div>
            <RegionToolbar
              regions={regions}
              selectedRegionId={selectedRegionId}
              onRegionChange={setSelectedRegionId}
              disabled={loadingRegions || regions.length === 0}
            />
          </div>

          <WebsiteSummaryCard
            url={website.url}
            status={overallStatus}
            incidents={incidents}
          />

          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/5 px-4 py-3">
              <h2 className="text-base font-bold text-white">Incidents</h2>
              <p className="text-xs text-gray-400">
                Outage history for {selectedRegionName}.
              </p>
            </div>
            <IncidentsList
              incidents={incidents}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              actionLoading={incidentActionLoading}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/5 px-4 py-3">
              <h2 className="text-base font-bold text-white">Timeline</h2>
              <p className="text-xs text-gray-400">
                Incident activity for {selectedRegionName}.
              </p>
            </div>
            <IncidentTimeline events={timeline} />
          </div>
        </>
      ) : null}
    </AppShell>
  )
}
