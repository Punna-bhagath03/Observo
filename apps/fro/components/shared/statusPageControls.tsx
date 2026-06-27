"use client"

import axios from "axios"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { requireAuthToken } from "@/hooks/useAuthToken"
import { publicStatusPageUrl } from "@/lib/siteUrl"
import { BACKEND_URL } from "@/lib/utils"

type StatusPageControlsProps = {
  websiteId: string
  enabled: boolean
  slug: string | null
}

export default function StatusPageControls({
  websiteId,
  enabled: initialEnabled,
  slug: initialSlug,
}: StatusPageControlsProps) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [slug, setSlug] = useState(initialSlug)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setEnabled(initialEnabled)
    setSlug(initialSlug)
  }, [initialEnabled, initialSlug])

  const save = async (nextEnabled: boolean) => {
    const token = requireAuthToken(router)
    if (!token) {
      return
    }

    setSaving(true)

    try {
      const response = await axios.patch<{
        status_page_enabled: boolean
        status_page_slug: string | null
      }>(
        `${BACKEND_URL}/website/${websiteId}/status-page`,
        { enabled: nextEnabled },
        { headers: { Authorization: token } }
      )

      setEnabled(response.data.status_page_enabled)
      setSlug(response.data.status_page_slug)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = () => {
    void save(!enabled)
  }

  const handleCopy = async () => {
    if (!slug) {
      return
    }

    await navigator.clipboard.writeText(publicStatusPageUrl(slug))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="flex h-5 items-center gap-3 whitespace-nowrap"
      data-row-action
      onClick={(event) => event.stopPropagation()}
    >
      <label className="inline-flex items-center gap-2 text-xs text-gray-300">
        <input
          type="checkbox"
          checked={enabled}
          disabled={saving}
          onChange={handleToggle}
          className="rounded border-white/20 bg-white/5"
        />
        Public
      </label>

      <button
        type="button"
        disabled={!enabled || !slug || saving}
        onClick={() => void handleCopy()}
        className={`text-xs transition-colors ${
          enabled && slug
            ? "text-cyan-400 hover:text-cyan-300"
            : "invisible pointer-events-none"
        }`}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}
