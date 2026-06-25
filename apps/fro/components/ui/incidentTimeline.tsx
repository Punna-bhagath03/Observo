import { formatTimelineDate } from "@/lib/utils"

export type TimelineEvent = {
  id: string
  type:
    | "website_added"
    | "check_down"
    | "check_up"
    | "incident_opened"
    | "incident_acknowledged"
    | "incident_resolved_manual"
    | "incident_resolved_auto"
  at: string
  title: string
  detail: string | null
  username: string | null
}

const iconStyles: Record<
  TimelineEvent["type"],
  { ring: string; icon: string; glyph: "bolt" | "user" | "check" }
> = {
  website_added: {
    ring: "border-gray-500/40 bg-gray-500/15",
    icon: "text-gray-300",
    glyph: "bolt",
  },
  check_down: {
    ring: "border-red-500/40 bg-red-500/15",
    icon: "text-red-400",
    glyph: "bolt",
  },
  check_up: {
    ring: "border-green-500/40 bg-green-500/15",
    icon: "text-green-400",
    glyph: "check",
  },
  incident_opened: {
    ring: "border-blue-500/40 bg-blue-500/15",
    icon: "text-blue-400",
    glyph: "bolt",
  },
  incident_acknowledged: {
    ring: "border-yellow-500/40 bg-yellow-500/15",
    icon: "text-yellow-400",
    glyph: "user",
  },
  incident_resolved_manual: {
    ring: "border-green-500/40 bg-green-500/15",
    icon: "text-green-400",
    glyph: "user",
  },
  incident_resolved_auto: {
    ring: "border-green-500/40 bg-green-500/15",
    icon: "text-green-400",
    glyph: "check",
  },
}

export default function IncidentTimeline({
  events,
}: {
  events: TimelineEvent[]
}) {
  if (events.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-gray-400">
        No timeline events yet.
      </div>
    )
  }

  return (
    <div className="px-6 py-5">
      <ul className="space-y-0">
        {events.map((event, index) => (
          <li key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
            {index < events.length - 1 ? (
              <span
                aria-hidden
                className="absolute top-9 left-4 w-px -translate-x-1/2 bg-white/10"
                style={{ height: "calc(100% - 1.25rem)" }}
              />
            ) : null}

            <TimelineIcon event={event} />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-200">{event.title}</p>
                  {event.detail ? (
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {event.detail}
                    </p>
                  ) : null}
                </div>
                <time
                  dateTime={event.at}
                  className="shrink-0 text-xs text-gray-500"
                >
                  {formatTimelineDate(event.at)}
                </time>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TimelineIcon({ event }: { event: TimelineEvent }) {
  const style = iconStyles[event.type]

  if (style.glyph === "user" && event.username) {
    return (
      <div
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${style.ring} ${style.icon}`}
      >
        {getInitials(event.username)}
      </div>
    )
  }

  return (
    <div
      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${style.ring}`}
    >
      {style.glyph === "check" ? (
        <svg
          className={`h-4 w-4 ${style.icon}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className={`h-4 w-4 ${style.icon}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      )}
    </div>
  )
}

function getInitials(username: string): string {
  const parts = username.split(/[@._\s-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  }
  return username.slice(0, 2).toUpperCase()
}
