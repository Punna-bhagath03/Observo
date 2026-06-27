import { Suspense } from "react"

import StatusPageClient from "@/components/status/statusPageClient"
import Spinner from "@/components/shared/spinner"

type StatusPageProps = {
  params: Promise<{ slug: string }>
}

export default async function StatusPage({ params }: StatusPageProps) {
  const { slug } = await params

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
          <Spinner className="h-6 w-6 text-cyan-400" />
        </div>
      }
    >
      <StatusPageClient slug={slug} />
    </Suspense>
  )
}
