"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

import { websiteIncidentsHref } from "@/lib/routes"

export default function WebsitePage() {
  const router = useRouter()
  const params = useParams()
  const websiteId = params.websiteId as string

  useEffect(() => {
    router.replace(websiteIncidentsHref(websiteId))
  }, [router, websiteId])

  return null
}
