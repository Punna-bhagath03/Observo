import Link from "next/link"

export default function StatusNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Status page not found</h1>
        <p className="mt-2 text-sm text-gray-400">
          This page is disabled or does not exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-cyan-400 hover:text-cyan-300"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
