"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import StatusPageView from "@/components/status/statusPageView"
import Spinner from "@/components/shared/spinner"
import {
  fetchPublicRegions,
  fetchPublicStatusPage,
  type PublicRegion,
  type PublicStatusPage,
} from "@/lib/publicStatus"

type StatusPageClientProps = {
  slug: string
}

function pickDefaultRegionId(
  regions: PublicRegion[],
  preferredRegionId: string | null
): string {
  if (
    preferredRegionId &&
    regions.some((region) => region.id === preferredRegionId)
  ) {
    return preferredRegionId
  }

  const india = regions.find((region) => region.name === "India")
  return india?.id ?? regions[0]?.id ?? ""
}

export default function StatusPageClient({ slug }: StatusPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const regionIdFromUrl = searchParams.get("regionId")

  const [regions, setRegions] = useState<PublicRegion[]>([])
  const [regionId, setRegionId] = useState("")
  const [page, setPage] = useState<PublicStatusPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestIdRef = useRef(0)

  const loadStatusPage = useCallback(
    async (
      nextRegionId: string,
      options?: { initial?: boolean; requestId?: number }
    ) => {
      if (!nextRegionId) {
        return false
      }

      setError(null)
      if (options?.initial) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      try {
        const data = await fetchPublicStatusPage(slug, nextRegionId)

        if (
          options?.requestId !== undefined &&
          options.requestId !== requestIdRef.current
        ) {
          return false
        }

        if (!data) {
          router.replace("/404")
          return false
        }

        setPage(data)
        return true
      } catch (loadError) {
        console.error(loadError)
        if (
          options?.requestId === undefined ||
          options.requestId === requestIdRef.current
        ) {
          setError("Could not load status page. Please try again.")
        }
        return false
      } finally {
        if (
          options?.requestId === undefined ||
          options.requestId === requestIdRef.current
        ) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [router, slug]
  )

  useEffect(() => {
    let cancelled = false
    const requestId = ++requestIdRef.current

    async function init() {
      setLoading(true)
      setError(null)

      try {
        const nextRegions = await fetchPublicRegions()
        if (cancelled || requestId !== requestIdRef.current) {
          return
        }

        setRegions(nextRegions)

        const nextRegionId = pickDefaultRegionId(
          nextRegions,
          regionIdFromUrl
        )
        setRegionId(nextRegionId)

        await loadStatusPage(nextRegionId, { initial: true, requestId })
      } catch (initError) {
        console.error(initError)
        if (!cancelled && requestId === requestIdRef.current) {
          setError("Could not load status page. Please try again.")
          setLoading(false)
        }
      }
    }

    void init()

    return () => {
      cancelled = true
    }
  }, [loadStatusPage, regionIdFromUrl, slug])

  const handleRegionChange = useCallback(
    (nextRegionId: string) => {
      const requestId = ++requestIdRef.current
      setRegionId(nextRegionId)
      void loadStatusPage(nextRegionId, { requestId })
    },
    [loadStatusPage]
  )

  const handleRefresh = useCallback(() => {
    if (!regionId) {
      return
    }

    const requestId = ++requestIdRef.current
    void loadStatusPage(regionId, { requestId })
  }, [loadStatusPage, regionId])

  if (loading && !page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <Spinner className="h-6 w-6 text-cyan-400" />
      </div>
    )
  }

  if (error && !page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 text-white">
        <div className="text-center">
          <p className="text-sm text-gray-300">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 text-sm text-cyan-400 hover:text-cyan-300"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!page) {
    return null
  }

  return (
    <StatusPageView
      page={page}
      regions={regions}
      regionId={regionId}
      onRegionChange={handleRegionChange}
      onRefresh={handleRefresh}
      refreshing={refreshing}
    />
  )
}
