import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BACKEND_URL = "http://localhost:3000"

const SELECTED_REGION_KEY = "selectedRegionId"

export function getSelectedRegionId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(SELECTED_REGION_KEY)
}

export function setSelectedRegionId(regionId: string) {
  localStorage.setItem(SELECTED_REGION_KEY, regionId)
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`

  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

export function formatTimelineDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}