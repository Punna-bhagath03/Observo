"use client"

import axios from "axios"
import { useEffect, useRef, useState } from "react"

import { BACKEND_URL } from "@/lib/utils"

type AddWebsiteModalProps = {
  isOpen: boolean
  onClose: () => void
  onAdded: () => void
}

export default function AddWebsiteModal({
  isOpen,
  onClose,
  onAdded,
}: AddWebsiteModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setError(null)
    setLoading(false)

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 50)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const url = String(formData.get("url") ?? "").trim()

    if (!url) {
      setError("Please enter a URL.")
      setLoading(false)
      return
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null

    if (!token) {
      setError("You are not signed in.")
      setLoading(false)
      return
    }

    try {
      await axios.post(
        `${BACKEND_URL}/website`,
        { url },
        { headers: { Authorization: token } }
      )

      onAdded()
      onClose()
    } catch (err) {
      console.error(err)
      setError("Could not add this website. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-website-title"
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d15]/95 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2
              id="add-website-title"
              className="text-2xl font-bold text-white"
            >
              Add website
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Start monitoring a new endpoint.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
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
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="url"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Website URL
            </label>
            <input
              ref={inputRef}
              id="url"
              name="url"
              type="url"
              required
              autoComplete="url"
              placeholder="https://example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              Include the protocol (e.g.{" "}
              <span className="font-mono">https://</span>).
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add website"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
