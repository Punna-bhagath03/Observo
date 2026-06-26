"use client"

import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import WebsiteMonitoringPanel from "@/components/monitoring/websiteMonitoringPanel"
import AppShell from "@/components/ui/appShell"
import RegionToolbar from "@/components/shared/regionToolbar"
import WebsiteSummaryCard from "@/components/shared/websiteSummaryCard"
import { ErrorState } from "@/components/shared/pageStates"
import WebsiteMonitoringPageSkeleton from "@/components/shared/skeletons/websiteMonitoringPageSkeleton"
import { requireAuthToken, useSignOut } from "@/hooks/useAuthToken"
import { useRegions } from "@/hooks/useRegions"
import type { MonitorSummary } from "@/lib/metrics"
import { BACKEND_URL } from "@/lib/utils"
import type { Incident } from "@/components/ui/incidentsList"

type WebsiteDetail = {
  id: string
  url: string
  ticks: { status: "Up" | "Down" | "Unknown" }[]
}

export default function WebsiteMonitoringPage() {
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
  const [monitor, setMonitor] = useState<MonitorSummary | null>(null)
  const [loading, setLoading] = useState(true)
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
      const [statusRes, incidentsRes] = await Promise.all([
        axios.get<{ website: WebsiteDetail }>(
          `${BACKEND_URL}/status/${websiteId}?regionId=${selectedRegionId}`,
          { headers: { Authorization: token } }
        ),
        axios.get<{ incidents: Incident[] }>(
          `${BACKEND_URL}/status/${websiteId}/incidents?regionId=${selectedRegionId}`,
          { headers: { Authorization: token } }
        ),
      ])

      setWebsite(statusRes.data.website)
      setIncidents(incidentsRes.data.incidents ?? [])
    } catch (err) {
      console.error(err)
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        localStorage.removeItem("token")
        router.push("/signin")
        return
      }
      setError("Could not load this monitor. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [router, selectedRegionId, websiteId])

  useEffect(() => {
    if (selectedRegionId) {
      setLoading(true)
      setMonitor(null)
      fetchWebsite()
    }
  }, [fetchWebsite, selectedRegionId])

  const latestTick = website?.ticks?.[0]
  const overallStatus =
    monitor?.status ??
    (latestTick?.status === "Unknown" || !latestTick
      ? "checking"
      : latestTick.status)

  const isLoading = loadingRegions || (loading && Boolean(selectedRegionId))
  const displayError = regionError ?? error

  return (
    <AppShell onSignOut={handleSignOut}>
      {isLoading ? (
        <WebsiteMonitoringPageSkeleton />
      ) : displayError ? (
        <ErrorState message={displayError} onRetry={fetchWebsite} />
      ) : website && selectedRegionId ? (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Monitoring</h1>
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

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
            <WebsiteMonitoringPanel
              websiteId={websiteId}
              regionId={selectedRegionId}
              regionName={selectedRegionName}
              onMonitorChange={setMonitor}
            />
          </div>
        </>
      ) : null}
    </AppShell>
  )
}
