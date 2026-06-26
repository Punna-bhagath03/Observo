type ObservoLogoMarkProps = {
  className?: string
  iconClassName?: string
}

export default function ObservoLogoMark({
  className = "h-8 w-8",
  iconClassName = "h-4 w-4",
}: ObservoLogoMarkProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 ${className}`}
    >
      <svg
        className={`text-white ${iconClassName}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    </div>
  )
}
