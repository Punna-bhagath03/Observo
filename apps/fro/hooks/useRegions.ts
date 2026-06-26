"use client"

import axios from "axios"
import { useEffect, useState } from "react"

import type { Region } from "@/components/shared/regionSelect"
import { BACKEND_URL, getSelectedRegionId, setSelectedRegionId } from "@/lib/utils"

type UseRegionsResult = {
  regions: Region[]
  selectedRegionId: string | null
  selectedRegionName: string
  loadingRegions: boolean
  regionError: string | null
  setSelectedRegionId: (regionId: string) => void
}

export function useRegions(): UseRegionsResult {
  const [regions, setRegions] = useState<Region[]>([])
  const [selectedRegionId, setSelectedRegionIdState] = useState<string | null>(
    null
  )
  const [loadingRegions, setLoadingRegions] = useState(true)
  const [regionError, setRegionError] = useState<string | null>(null)

  useEffect(() => {
    axios
      .get<{ regions: Region[] }>(`${BACKEND_URL}/regions`)
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
        }
      })
      .catch((err) => {
        console.error(err)
        setRegionError("Could not load regions. Please try again.")
      })
      .finally(() => {
        setLoadingRegions(false)
      })
  }, [])

  function handleRegionChange(regionId: string) {
    setSelectedRegionId(regionId)
    setSelectedRegionIdState(regionId)
  }

  const selectedRegionName =
    regions.find((region) => region.id === selectedRegionId)?.name ?? "India"

  return {
    regions,
    selectedRegionId,
    selectedRegionName,
    loadingRegions,
    regionError,
    setSelectedRegionId: handleRegionChange,
  }
}
