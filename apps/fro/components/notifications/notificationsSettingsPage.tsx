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
  type ChannelRules,
} from "@/lib/notifications"

const DEFAULT_RULES = (): ChannelRules => ({
  "incident.opened": true,
  "incident.acknowledged": false,
  "incident.resolved": true,
})

function RulesCheckboxes({
  rules,
  onChange,
  prefix,
}: {
  rules: ChannelRules
  onChange: (rules: ChannelRules) => void
  prefix: string
}) {
  return (
    <div className="space-y-3">
      {INCIDENT_EVENT_TYPES.map((eventType) => (
        <label
          key={`${prefix}-${eventType}`}
          className="flex items-center gap-3 text-sm text-gray-200"
        >
          <input
            type="checkbox"
            checked={rules[eventType]}
            onChange={(event) =>
              onChange({
                ...rules,
                [eventType]: event.target.checked,
              })
            }
            className="rounded border-white/20 bg-white/5"
          />
          {INCIDENT_EVENT_LABELS[eventType]}
        </label>
      ))}
    </div>
  )
}

export default function NotificationsSettingsPage() {
  const router = useRouter()
  const handleSignOut = useSignOut()
  const [email, setEmail] = useState("")
  const [emailRules, setEmailRules] = useState(DEFAULT_RULES)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [webhookHasSecret, setWebhookHasSecret] = useState(false)
  const [webhookRules, setWebhookRules] = useState(DEFAULT_RULES)
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null)
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
      setEmail(settings.email.address ?? "")
      setEmailRules(settings.email.rules)
      setWebhookUrl(settings.webhook.url ?? "")
      setWebhookEnabled(settings.webhook.enabled)
      setWebhookHasSecret(settings.webhook.hasSecret)
      setWebhookRules(settings.webhook.rules)
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

  const handleSave = async (options?: { regenerateSecret?: boolean }) => {
    const token = requireAuthToken(router)
    if (!token) {
      return
    }

    const hasEmail = email.trim().length > 0
    const hasWebhook = webhookEnabled && webhookUrl.trim().length > 0

    if (webhookEnabled && !webhookUrl.trim()) {
      setError("Webhook URL is required when webhook is enabled.")
      return
    }

    if (!hasEmail && !hasWebhook && !webhookEnabled) {
      setError("Add an email address or webhook URL.")
      return
    }

    setSaving(true)
    setSaved(false)
    setError(null)
    setWebhookSecret(null)

    try {
      const response = await saveNotificationSettings(token, {
        ...(hasEmail
          ? {
              email: {
                address: email.trim(),
                rules: emailRules,
              },
            }
          : {}),
        ...(hasWebhook
          ? {
              webhook: {
                url: webhookUrl.trim(),
                rules: webhookRules,
                regenerateSecret: options?.regenerateSecret,
              },
            }
          : !webhookEnabled
            ? { disableWebhook: true }
            : {}),
      })

      setEmail(response.email.address ?? "")
      setEmailRules(response.email.rules)
      setWebhookUrl(response.webhook.url ?? "")
      setWebhookEnabled(response.webhook.enabled)
      setWebhookHasSecret(response.webhook.hasSecret)
      setWebhookRules(response.webhook.rules)

      if (response.webhookSecret) {
        setWebhookSecret(response.webhookSecret)
      }

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
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
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
          <>
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl">
              <h2 className="text-sm font-semibold text-white">Email</h2>
              <label className="mt-4 block">
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
                <RulesCheckboxes
                  prefix="email"
                  rules={emailRules}
                  onChange={setEmailRules}
                />
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Uses Resend on the notifier service. On the free test sender,
                Resend only delivers to your signup email until you verify a
                domain.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">Webhook</h2>
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={webhookEnabled}
                    onChange={(event) => setWebhookEnabled(event.target.checked)}
                    className="rounded border-white/20 bg-white/5"
                  />
                  Enabled
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-medium tracking-wider text-gray-400 uppercase">
                  Endpoint URL
                </span>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                  placeholder="https://your-server.com/observo/webhook"
                  disabled={!webhookEnabled}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40 disabled:opacity-50"
                />
              </label>

              <div className="mt-6">
                <p className="mb-3 text-xs font-medium tracking-wider text-gray-400 uppercase">
                  POST when
                </p>
                <RulesCheckboxes
                  prefix="webhook"
                  rules={webhookRules}
                  onChange={setWebhookRules}
                />
              </div>

              {webhookHasSecret ? (
                <p className="mt-4 text-xs text-gray-500">
                  Signing secret is configured. Rotate it if your endpoint was
                  exposed.
                </p>
              ) : null}

              {webhookSecret ? (
                <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <p className="text-xs font-medium text-cyan-200">
                    Copy this signing secret now. It will not be shown again.
                  </p>
                  <code className="mt-2 block break-all text-xs text-gray-200">
                    {webhookSecret}
                  </code>
                </div>
              ) : null}

              <p className="mt-4 text-xs text-gray-500">
                Each delivery is a signed POST with{" "}
                <code className="text-gray-400">X-Observo-Signature</code>{" "}
                (HMAC-SHA256, Stripe-style). Use any free HTTPS endpoint such as
                your own server or a tunnel like Cloudflare Tunnel / ngrok for
                local testing.
              </p>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-medium text-white transition-all hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save settings"}
              </button>
              {webhookEnabled && webhookHasSecret ? (
                <button
                  type="button"
                  onClick={() => void handleSave({ regenerateSecret: true })}
                  disabled={saving || !webhookUrl.trim()}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-gray-200 transition-colors hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Rotate webhook secret
                </button>
              ) : null}
              {saved ? (
                <span className="text-xs text-green-400">Saved</span>
              ) : null}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
