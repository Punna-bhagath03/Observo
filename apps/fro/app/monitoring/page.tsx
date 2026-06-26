"use client"

import MonitoringOverviewPage from "@/components/monitoring/monitoringOverview"
import { useSignOut } from "@/hooks/useAuthToken"

export default function MonitoringPage() {
  const handleSignOut = useSignOut()

  return <MonitoringOverviewPage onSignOut={handleSignOut} />
}
