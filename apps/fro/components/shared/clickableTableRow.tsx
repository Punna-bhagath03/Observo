"use client"

import { useRouter } from "next/navigation"
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react"

type ClickableTableRowProps = {
  href: string
  children: ReactNode
  className?: string
}

export default function ClickableTableRow({
  href,
  children,
  className = "",
}: ClickableTableRowProps) {
  const router = useRouter()

  function navigate() {
    router.push(href)
  }

  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    const target = event.target as HTMLElement
    if (target.closest("[data-row-action]")) {
      return
    }
    navigate()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      navigate()
    }
  }

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.04] ${className}`}
    >
      {children}
    </tr>
  )
}
