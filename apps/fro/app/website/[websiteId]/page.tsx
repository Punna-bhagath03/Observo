"use client"

import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import {
  BACKEND_URL,
  getSelectedRegionId,
  setSelectedRegionId,
} from "@/lib/utils"
import RegionSelect, { type Region } from "@/components/ui/regionSelect"

type WebsiteTick = {
  status: "Up" | "Down" | "Unknown"
  response_time_ms: number
  createdAt: string
}

type WebsiteDetail = {
  id: string
  url: string
  user_id: string
  ticks: WebsiteTick[]
}

type StatusResponse = {
  website: WebsiteDetail
}

type RegionsResponse = {
  regions: Region[]
}

function getOverallStatus(ticks?: WebsiteTick[]): "Up" | "Down" | "checking" {
  const latest = ticks?.[0]
  if (!latest || latest.status === "Unknown") return "checking"
  return latest.status
}

export default function WebsitePage() {
  const router = useRouter()
  const params = useParams()
  const websiteId = params.websiteId as string

  const [website, setWebsite] = useState<WebsiteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [selectedRegionId, setSelectedRegionIdState] = useState<string | null>(
    null
  )

  const fetchWebsite = useCallback(async () => {
    if (!selectedRegionId) {
      return
    }

    setError(null)

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null

    if (!token) {
      router.push("/signin")
      return
    }

    try {
      const res = await axios.get<StatusResponse>(
        `${BACKEND_URL}/status/${websiteId}?regionId=${selectedRegionId}`,
        { headers: { Authorization: token } }
      )
      setWebsite({
        ...res.data.website,
        ticks: res.data.website.ticks ?? [],
      })
    } catch (err) {
      console.error(err)
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        localStorage.removeItem("token")
        router.push("/signin")
        return
      }
      setError("Could not load this website. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [router, websiteId, selectedRegionId])

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
      setLoading(true)
      fetchWebsite()
    }
  }, [fetchWebsite, selectedRegionId])

  function handleRegionChange(regionId: string) {
    setSelectedRegionId(regionId)
    setSelectedRegionIdState(regionId)
  }

  const selectedRegionName =
    regions.find((region) => region.id === selectedRegionId)?.name ?? "India"

  const ticks = website?.ticks ?? []
  const overallStatus = getOverallStatus(ticks)

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

          <a
            href="/dashboard"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10"
          >
            Back to dashboard
          </a>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchWebsite} />
        ) : website ? (
          <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold md:text-4xl">Website details</h1>
                <p className="mt-2 text-sm text-gray-400">
                  Last 10 uptime checks from {selectedRegionName}.
                </p>
              </div>

              <RegionSelect
                regions={regions}
                value={selectedRegionId ?? ""}
                onChange={handleRegionChange}
                disabled={loading || regions.length === 0}
              />
            </div>

            <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs font-medium tracking-wider text-gray-400 uppercase">
                    URL
                  </p>
                  <a
                    href={website.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-white transition-colors hover:text-cyan-400"
                  >
                    {website.url}
                  </a>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium tracking-wider text-gray-400 uppercase">
                    Overall status
                  </p>
                  <StatusBadge status={overallStatus} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium tracking-wider text-gray-400 uppercase">
                    Latest response
                  </p>
                  <p className="text-sm text-gray-300">
                    {typeof ticks[0]?.response_time_ms === "number"
                      ? `${ticks[0].response_time_ms} ms`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
              {ticks.length === 0 ? (
                <div className="px-6 py-20 text-center text-sm text-gray-400">
                  No checks recorded yet. The worker will populate ticks shortly.
                </div>
              ) : (
                <RecentStatusChecks ticks={ticks} />
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}

function RecentStatusChecks({ ticks }: { ticks: WebsiteTick[] }) {
  const timeline = [...ticks].reverse()
  const upCount = ticks.filter((t) => t.status === "Up").length
  const successRate =
    ticks.length > 0 ? ((upCount / ticks.length) * 100).toFixed(1) : "0.0"
  const avgResponse =
    ticks.length > 0
      ? Math.round(
          ticks.reduce((sum, t) => sum + t.response_time_ms, 0) / ticks.length
        )
      : 0

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Recent Status Checks</h2>
          <p className="text-xs text-gray-400">
            Last 10 monitoring checks with response times
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Up
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Down
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs text-gray-400">Timeline:</p>
        <div className="flex flex-wrap items-center gap-2">
          {timeline.map((tick, i) => (
            <TimelineDot key={`${tick.createdAt}-${i}`} status={tick.status} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
        <div className="text-center">
          <p className="text-xl font-bold text-white">{successRate}%</p>
          <p className="text-xs text-gray-400">Success Rate</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">{avgResponse}ms</p>
          <p className="text-xs text-gray-400">Avg Response</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">{ticks.length}</p>
          <p className="text-xs text-gray-400">Total Checks</p>
        </div>
      </div>
    </div>
  )
}

function TimelineDot({ status }: { status: WebsiteTick["status"] }) {
  if (status === "Up") {
    return (
      <div
        title="Up"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-green-500/40 bg-green-500/20"
      >
        <svg
          className="h-4 w-4 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    )
  }

  if (status === "Down") {
    return (
      <div
        title="Down"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/40 bg-red-500/20"
      >
        <svg
          className="h-4 w-4 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      title="Unknown"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-yellow-500/40 bg-yellow-500/20"
    >
      <span className="h-2 w-2 rounded-full bg-yellow-400" />
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
      label: "checking",
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

function LoadingState() {
  return (
    <div className="flex items-center justify-center px-6 py-20 text-sm text-gray-400">
      <svg
        className="mr-3 h-5 w-5 animate-spin text-cyan-400"
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
      Loading website...
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
