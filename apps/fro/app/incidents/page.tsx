"use client"

import IncidentsOverviewPage from "@/components/ui/incidentsOverview"
import { useSignOut } from "@/hooks/useAuthToken"

export default function IncidentsPage() {
  const handleSignOut = useSignOut()

  return <IncidentsOverviewPage onSignOut={handleSignOut} />
}

