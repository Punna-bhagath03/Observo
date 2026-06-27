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

const SECRET_REVEAL_MS = 2 * 60 * 1000
const FLASH_MS = 2_000

type ChannelSnapshot = {
  value: string
  enabled: boolean
  rules: ChannelRules
}

function rulesEqual(a: ChannelRules, b: ChannelRules) {
  return INCIDENT_EVENT_TYPES.every((eventType) => a[eventType] === b[eventType])
}

function isChannelDirty(
  saved: ChannelSnapshot | null,
  value: string,
  enabled: boolean,
  rules: ChannelRules
) {
  return (
    saved !== null &&
    (value.trim() !== saved.value ||
      enabled !== saved.enabled ||
      !rulesEqual(rules, saved.rules))
  )
}

function channelSectionClass(enabled: boolean) {
  return `rounded-2xl border bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-in-out ${
    enabled ? "border-white/10" : "border-red-500/15 bg-red-500/[0.02]"
  }`
}

function flashSaved(setSaved: (value: boolean) => void) {
  setSaved(true)
  window.setTimeout(() => setSaved(false), FLASH_MS)
}

function ChannelToggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (enabled: boolean) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={() => onChange(!enabled)}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-in-out ${
        enabled
          ? "border-red-500/35 bg-red-500/10 text-red-300 hover:border-red-500/50 hover:bg-red-500/15"
          : "border-cyan-500/35 bg-cyan-500/10 text-cyan-300 hover:border-cyan-500/50 hover:bg-cyan-500/15"
      }`}
    >
      {enabled ? "Disable" : "Enable"}
    </button>
  )
}

function SectionSaveButton({
  dirty,
  saving,
  saved,
  onSave,
}: {
  dirty: boolean
  saving: boolean
  saved: boolean
  onSave: () => void
}) {
  const showSaved = saved && !saving

  return (
    <button
      type="button"
      onClick={onSave}
      disabled={(!dirty && !showSaved) || saving || showSaved}
      className={`h-10 min-w-[4.5rem] shrink-0 rounded-xl px-4 text-xs font-medium transition-all duration-300 ease-in-out disabled:cursor-not-allowed ${
        showSaved
          ? "border border-green-500/40 bg-green-500/15 text-green-300 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
          : saving
            ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 opacity-80"
            : dirty
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
              : "border border-white/10 bg-white/[0.02] text-gray-500 opacity-50"
      }`}
    >
      {saving ? "Saving…" : showSaved ? "Saved" : "Save"}
    </button>
  )
}

function RulesCheckboxes({
  rules,
  onChange,
  prefix,
  disabled = false,
}: {
  rules: ChannelRules
  onChange: (rules: ChannelRules) => void
  prefix: string
  disabled?: boolean
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 transition-opacity duration-300 ease-in-out sm:gap-x-4 ${
        disabled ? "pointer-events-none opacity-40" : "opacity-100"
      }`}
    >
      {INCIDENT_EVENT_TYPES.map((eventType) => (
        <label
          key={`${prefix}-${eventType}`}
          className="flex min-w-0 shrink-0 items-center gap-1.5 text-[10px] text-gray-200 sm:text-[11px]"
        >
          <input
            type="checkbox"
            checked={rules[eventType]}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...rules,
                [eventType]: event.target.checked,
              })
            }
            className="size-3.5 shrink-0 rounded border-white/20 bg-white/5 accent-cyan-500"
          />
          <span className="whitespace-nowrap">{INCIDENT_EVENT_LABELS[eventType]}</span>
        </label>
      ))}
    </div>
  )
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg
        className="size-2.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }

  return (
    <svg
      className="size-2.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  )
}

function WebhookSecretReveal({
  secret,
  copied,
  onCopy,
}: {
  secret: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
      <p className="text-xs font-medium text-cyan-200">
        Copy this signing secret now. It will not be shown again and hides
        automatically in 2 minutes.
      </p>
      <div className="relative mt-2 rounded-lg border border-white/5 bg-black/20 px-2.5 py-2 pr-8">
        <code className="block break-all font-mono text-[10px] leading-4 text-gray-200">
          {secret}
        </code>
        <button
          type="button"
          aria-label={copied ? "Copied" : "Copy signing secret"}
          title={copied ? "Copied" : "Copy"}
          onClick={onCopy}
          className="absolute top-1/2 right-1.5 inline-flex size-4 -translate-y-1/2 items-center justify-center rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 transition-colors hover:border-cyan-500/50 hover:bg-cyan-500/15"
        >
          <CopyIcon copied={copied} />
        </button>
      </div>
    </div>
  )
}

export default function NotificationsSettingsPage() {
  const router = useRouter()
  const handleSignOut = useSignOut()
  const [email, setEmail] = useState("")
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [emailRules, setEmailRules] = useState(DEFAULT_RULES)
  const [savedEmail, setSavedEmail] = useState<ChannelSnapshot | null>(null)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [webhookHasSecret, setWebhookHasSecret] = useState(false)
  const [webhookRules, setWebhookRules] = useState(DEFAULT_RULES)
  const [savedWebhook, setSavedWebhook] = useState<ChannelSnapshot | null>(null)
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null)
  const [secretCopied, setSecretCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingWebhook, setSavingWebhook] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [webhookSaved, setWebhookSaved] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [webhookError, setWebhookError] = useState<string | null>(null)

  const emailDirty = isChannelDirty(savedEmail, email, emailEnabled, emailRules)
  const webhookDirty = isChannelDirty(
    savedWebhook,
    webhookUrl,
    webhookEnabled,
    webhookRules
  )

  const applyEmailSettings = useCallback(
    (settings: { address: string | null; enabled: boolean; rules: ChannelRules }) => {
      const snapshot: ChannelSnapshot = {
        value: settings.address ?? "",
        enabled: settings.enabled,
        rules: settings.rules,
      }
      setEmail(snapshot.value)
      setEmailEnabled(snapshot.enabled)
      setEmailRules(snapshot.rules)
      setSavedEmail(snapshot)
    },
    []
  )

  const applyWebhookSettings = useCallback(
    (settings: {
      url: string | null
      enabled: boolean
      hasSecret: boolean
      rules: ChannelRules
    }) => {
      const snapshot: ChannelSnapshot = {
        value: settings.url ?? "",
        enabled: settings.enabled,
        rules: settings.rules,
      }
      setWebhookUrl(snapshot.value)
      setWebhookEnabled(snapshot.enabled)
      setWebhookHasSecret(settings.hasSecret)
      setWebhookRules(snapshot.rules)
      setSavedWebhook(snapshot)
    },
    []
  )

  useEffect(() => {
    setSecretCopied(false)
    if (!webhookSecret) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setWebhookSecret(null)
    }, SECRET_REVEAL_MS)

    return () => window.clearTimeout(timeoutId)
  }, [webhookSecret])

  const handleCopySecret = async () => {
    if (!webhookSecret) {
      return
    }

    await navigator.clipboard.writeText(webhookSecret)
    setSecretCopied(true)
    window.setTimeout(() => setSecretCopied(false), FLASH_MS)
  }

  const loadSettings = useCallback(async () => {
    const token = requireAuthToken(router)
    if (!token) {
      setLoading(false)
      return
    }

    setLoadError(null)

    try {
      const settings = await fetchNotificationSettings(token)
      applyEmailSettings(settings.email)
      applyWebhookSettings(settings.webhook)
    } catch (err) {
      console.error(err)
      setLoadError("Could not load notification settings.")
    } finally {
      setLoading(false)
    }
  }, [applyEmailSettings, applyWebhookSettings, router])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const handleSaveEmail = async () => {
    const token = requireAuthToken(router)
    if (!token || !emailDirty) {
      return
    }

    const trimmed = email.trim()
    const disablingEmail = !emailEnabled && (Boolean(savedEmail?.value) || trimmed.length > 0)

    if (emailEnabled && !trimmed) {
      setEmailError("Email address is required when email is enabled.")
      return
    }

    if (!trimmed && !disablingEmail) {
      setEmailError("Add an email address.")
      return
    }

    setSavingEmail(true)
    setEmailSaved(false)
    setEmailError(null)

    try {
      const response = await saveNotificationSettings(token, {
        ...(trimmed
          ? { email: { address: trimmed, rules: emailRules, enabled: emailEnabled } }
          : { disableEmail: true }),
      })

      applyEmailSettings(response.email)
      flashSaved(setEmailSaved)
    } catch (err) {
      console.error(err)
      setEmailError("Could not save email settings.")
    } finally {
      setSavingEmail(false)
    }
  }

  const handleSaveWebhook = async (options?: { regenerateSecret?: boolean }) => {
    const token = requireAuthToken(router)
    if (!token || (!webhookDirty && !options?.regenerateSecret)) {
      return
    }

    const trimmed = webhookUrl.trim()
    const disablingWebhook =
      !webhookEnabled &&
      (Boolean(savedWebhook?.value) || trimmed.length > 0 || webhookHasSecret)

    if (webhookEnabled && !trimmed) {
      setWebhookError("Webhook URL is required when webhook is enabled.")
      return
    }

    if (!trimmed && !disablingWebhook && !options?.regenerateSecret) {
      setWebhookError("Add a webhook URL.")
      return
    }

    setSavingWebhook(true)
    setWebhookSaved(false)
    if (!options?.regenerateSecret) {
      setWebhookError(null)
    }
    setWebhookSecret(null)

    try {
      const response = await saveNotificationSettings(token, {
        ...(webhookEnabled && trimmed
          ? {
              webhook: {
                url: trimmed,
                rules: webhookRules,
                regenerateSecret: options?.regenerateSecret,
              },
            }
          : disablingWebhook
            ? { disableWebhook: true }
            : {}),
      })

      applyWebhookSettings(response.webhook)

      if (response.webhookSecret) {
        setWebhookSecret(response.webhookSecret)
      }

      flashSaved(setWebhookSaved)
    } catch (err) {
      console.error(err)
      setWebhookError("Could not save webhook settings.")
    } finally {
      setSavingWebhook(false)
    }
  }

  return (
    <AppShell onSignOut={handleSignOut}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Notifications</h1>
          <p className="mt-1.5 text-xs text-gray-400">
            Configure email and webhook alerts for your incidents.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-6 w-6 text-cyan-400" />
          </div>
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={loadSettings} />
        ) : (
          <>
            <section className={channelSectionClass(emailEnabled)}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">Email</h2>
                <ChannelToggle
                  enabled={emailEnabled}
                  onChange={(enabled) => {
                    setEmailEnabled(enabled)
                    setEmailError(null)
                  }}
                />
              </div>

              <div
                className={`mt-4 space-y-6 transition-opacity duration-300 ease-in-out ${
                  emailEnabled ? "opacity-100" : "opacity-50"
                }`}
              >
                <div>
                  <span className="mb-2 block text-xs font-medium tracking-wider text-gray-400 uppercase">
                    Alert email
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        setEmailError(null)
                      }}
                      placeholder="you@company.com"
                      className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors duration-300 focus:border-cyan-500/40"
                    />
                    <SectionSaveButton
                      dirty={emailDirty}
                      saving={savingEmail}
                      saved={emailSaved}
                      onSave={() => void handleSaveEmail()}
                    />
                  </div>
                  {emailError ? (
                    <p className="mt-2 text-xs text-red-300">{emailError}</p>
                  ) : null}
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium tracking-wider text-gray-400 uppercase">
                    Email me when
                  </p>
                  <RulesCheckboxes
                    prefix="email"
                    rules={emailRules}
                    onChange={setEmailRules}
                    disabled={!emailEnabled}
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Alerts are sent to this address when email is enabled and the
                  selected events occur.
                </p>
              </div>
            </section>

            <section className={channelSectionClass(webhookEnabled)}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">Webhook</h2>
                <ChannelToggle
                  enabled={webhookEnabled}
                  onChange={(enabled) => {
                    setWebhookEnabled(enabled)
                    setWebhookError(null)
                  }}
                />
              </div>

              <div
                className={`mt-4 space-y-6 transition-opacity duration-300 ease-in-out ${
                  webhookEnabled ? "opacity-100" : "opacity-50"
                }`}
              >
                <div>
                  <span className="mb-2 block text-xs font-medium tracking-wider text-gray-400 uppercase">
                    Endpoint URL
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(event) => {
                        setWebhookUrl(event.target.value)
                        setWebhookError(null)
                      }}
                      placeholder="https://your-server.com/observo/webhook"
                      disabled={!webhookEnabled}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors duration-300 focus:border-cyan-500/40 disabled:opacity-50"
                    />
                    <SectionSaveButton
                      dirty={webhookDirty}
                      saving={savingWebhook}
                      saved={webhookSaved}
                      onSave={() => void handleSaveWebhook()}
                    />
                  </div>
                  {webhookError ? (
                    <p className="mt-2 text-xs text-red-300">{webhookError}</p>
                  ) : null}
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium tracking-wider text-gray-400 uppercase">
                    POST when
                  </p>
                  <RulesCheckboxes
                    prefix="webhook"
                    rules={webhookRules}
                    onChange={setWebhookRules}
                    disabled={!webhookEnabled}
                  />
                </div>

                {webhookHasSecret ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs text-gray-500">
                      Signing secret is configured. Rotate it if your endpoint was
                      exposed.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleSaveWebhook({ regenerateSecret: true })}
                      disabled={savingWebhook || !webhookUrl.trim() || !webhookEnabled}
                      className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Rotate secret
                    </button>
                  </div>
                ) : null}

                {webhookSecret ? (
                  <WebhookSecretReveal
                    secret={webhookSecret}
                    copied={secretCopied}
                    onCopy={() => void handleCopySecret()}
                  />
                ) : null}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
