"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import AppShell from "@/components/ui/appShell"
import { ErrorState } from "@/components/shared/pageStates"
import Spinner from "@/components/shared/spinner"
import { requireAuthToken, useSignOut } from "@/hooks/useAuthToken"
import {
  fetchNotificationSettings,
  INCIDENT_EVENT_LABELS,
  INCIDENT_EVENT_TYPES,
  saveNotificationSettings,
  type IncidentEventType,
} from "@/lib/notifications"

const DEFAULT_RULES = (): Record<IncidentEventType, boolean> => ({
  "incident.opened": true,
  "incident.acknowledged": false,
  "incident.resolved": true,
})

export default function NotificationsSettingsPage() {
  const router = useRouter()
  const handleSignOut = useSignOut()
  const [email, setEmail] = useState("")
  const [rules, setRules] = useState(DEFAULT_RULES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    const token = requireAuthToken(router)
    if (!token) {
      setLoading(false)
      return
    }

    setError(null)

    try {
      const settings = await fetchNotificationSettings(token)
      setEmail(settings.email ?? "")
      setRules(settings.rules)
    } catch (loadError) {
      console.error(loadError)
      setError("Could not load notification settings.")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    const token = requireAuthToken(router)
    if (!token || !email.trim()) {
      return
    }

    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const settings = await saveNotificationSettings(token, {
        email: email.trim(),
        rules,
      })
      setEmail(settings.email ?? "")
      setRules(settings.rules)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } catch (saveError) {
      console.error(saveError)
      setError("Could not save notification settings.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell onSignOut={handleSignOut}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">Notifications</h1>
          <p className="mt-1.5 text-xs text-gray-400">
            Choose where Observo sends incident alerts. Delivery is immediate
            when an event occurs.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-6 w-6 text-cyan-400" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadSettings} />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl">
            <label className="block">
              <span className="mb-2 block text-xs font-medium tracking-wider text-gray-400 uppercase">
                Alert email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40"
              />
            </label>

            <div className="mt-6">
              <p className="mb-3 text-xs font-medium tracking-wider text-gray-400 uppercase">
                Email me when
              </p>
              <div className="space-y-3">
                {INCIDENT_EVENT_TYPES.map((eventType) => (
                  <label
                    key={eventType}
                    className="flex items-center gap-3 text-sm text-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={rules[eventType]}
                      onChange={(event) =>
                        setRules((current) => ({
                          ...current,
                          [eventType]: event.target.checked,
                        }))
                      }
                      className="rounded border-white/20 bg-white/5"
                    />
                    {INCIDENT_EVENT_LABELS[eventType]}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !email.trim()}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-medium text-white transition-all hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save settings"}
              </button>
              {saved ? (
                <span className="text-xs text-green-400">Saved</span>
              ) : null}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Uses Resend on the notifier service. On the free test sender (
              <code className="text-gray-400">onboarding@resend.dev</code>
              ), Resend only delivers to the email address you signed up with.
              Use that address here until you verify your own domain.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
