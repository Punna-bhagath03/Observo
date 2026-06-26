"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import AppSidebar from "@/components/ui/appSidebar"

type AppShellProps = {
  children: React.ReactNode
  onSignOut?: () => void
}

export default function AppShell({ children, onSignOut }: AppShellProps) {
  const pathname = usePathname()
  const showBackToDashboard = pathname !== "/dashboard"

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-1/2 -z-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
      />

      <AppSidebar />

      <div className="relative min-h-screen pl-14">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-5 py-3">
            <Link
              href="/dashboard"
              className="text-lg font-bold transition-opacity hover:opacity-90"
            >
              Observo
            </Link>

            {onSignOut ? (
              <div className="flex items-center gap-2">
                {showBackToDashboard ? (
                  <Link
                    href="/dashboard"
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10"
                  >
                    Back to Dashboard
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <main className="relative mx-auto max-w-7xl px-5 py-8">{children}</main>
      </div>
    </div>
  )
}
