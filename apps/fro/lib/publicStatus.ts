import type {
  MonitorSummary,
  PeriodStatRow,
} from "@/lib/metrics"
import { BACKEND_URL } from "@/lib/utils"

export type PublicIncident = {
  id: string
  started_at: string
  resolved_at: string | null
  ongoing: boolean
  duration_ms: number | null
}

export type PublicStats24h = {
  uptimePercentage: number
  avgResponseTimeMs: number
  failures: number
  totalChecks: number
  lastOutageAt: string | null
}

export type PublicStatusPage = {
  url: string
  slug: string
  regionId: string
  region: string
  monitor: MonitorSummary
  stats24h: PublicStats24h
  periodStats: PeriodStatRow[]
  incidents: PublicIncident[]
}

export type PublicRegion = {
  id: string
  name: string
}

export async function fetchPublicRegions(): Promise<PublicRegion[]> {
  const response = await fetch(`${BACKEND_URL}/regions`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Could not load regions.")
  }

  const data = (await response.json()) as { regions: PublicRegion[] }
  return data.regions ?? []
}

export async function fetchPublicStatusPage(
  slug: string,
  regionId: string
): Promise<PublicStatusPage | null> {
  const response = await fetch(
    `${BACKEND_URL}/public/status/${slug}?regionId=${regionId}`,
    { cache: "no-store" }
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error("Could not load status page.")
  }

  return response.json()
}
