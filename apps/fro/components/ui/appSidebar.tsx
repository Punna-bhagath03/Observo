"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import ObservoLogoMark from "@/components/ui/observoLogoMark"
import { isIncidentsPath, isMonitoringPath, isNotificationsPath } from "@/lib/routes"

type NavItem = {
  href: string
  label: string
  match: (pathname: string) => boolean
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Landing page",
    match: (pathname) => pathname === "/",
    icon: <ObservoLogoMark className="h-9 w-9" iconClassName="h-4 w-4" />,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    match: (pathname) => pathname === "/dashboard",
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z"
        />
      </svg>
    ),
  },
  {
    href: "/incidents",
    label: "Incidents",
    match: isIncidentsPath,
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M12 9v2m0 4h.01M10.3 3.6L3.4 17.2A1.5 1.5 0 004.8 19.2h14.4a1.5 1.5 0 001.4-2.1L13.7 3.6a1.5 1.5 0 00-2.8 0z"
        />
      </svg>
    ),
  },
  {
    href: "/monitoring",
    label: "Monitoring",
    match: isMonitoringPath,
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M3 3v18h18M7 16l4-4 4 4 5-6"
        />
      </svg>
    ),
  },
  {
    href: "/settings/notifications",
    label: "Notifications",
    match: isNotificationsPath,
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
]

function SidebarNavItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
        active
          ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
          : "border-transparent text-gray-400 hover:border-white/10 hover:bg-white/5 hover:text-gray-200"
      }`}
    >
      {item.icon}
      <span className="pointer-events-none absolute left-[calc(100%+0.625rem)] z-50 whitespace-nowrap rounded-md border border-white/10 bg-[#12121a] px-2 py-1 text-[12px] font-medium text-gray-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {item.label}
      </span>
    </Link>
  )
}

export default function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-14 flex-col items-center border-r border-white/5 bg-[#08080d]/95 py-3 backdrop-blur-xl">
      <nav className="flex flex-col items-center gap-2">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            item={item}
            active={item.match(pathname)}
          />
        ))}
      </nav>
    </aside>
  )
}
