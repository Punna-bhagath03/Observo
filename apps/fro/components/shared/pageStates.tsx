export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-4 max-w-sm text-xs text-gray-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10"
      >
        Try again
      </button>
    </div>
  )
}
