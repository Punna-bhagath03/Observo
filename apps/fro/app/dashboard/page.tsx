"use client"
import DashboardPage from "@/components/ui/dashboard"
import { useSignOut } from "@/hooks/useAuthToken"

export default function () {
  const handleSignOut = useSignOut()
  return (
    <div>
      <DashboardPage onSignOut={handleSignOut} />
    </div>
  )
}
