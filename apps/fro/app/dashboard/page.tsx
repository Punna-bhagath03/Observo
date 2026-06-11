"use client"
import DashboardPage from "@/components/ui/dashboard"
import { useRouter } from "next/navigation"

export default function () {
  const router = useRouter();
  return <div>
      <DashboardPage onSignOut={()=>{
        localStorage.removeItem("token")
        router.push("/signin")
      }}/>
    </div>
  }
