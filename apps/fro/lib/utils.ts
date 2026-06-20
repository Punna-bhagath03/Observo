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