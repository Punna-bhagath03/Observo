"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  return localStorage.getItem("token")
}

export function useIsSignedIn(): boolean {
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    setIsSignedIn(Boolean(getAuthToken()))
  }, [])

  return isSignedIn
}

export function useSignOut() {
  const router = useRouter()

  return () => {
    localStorage.removeItem("token")
    router.push("/signin")
  }
}

export function requireAuthToken(router: { push: (path: string) => void }): string | null {
  const token = getAuthToken()
  if (!token) {
    router.push("/signin")
    return null
  }
  return token
}
