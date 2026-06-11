"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import axios from "axios"
import { BACKEND_URL } from "@/lib/utils"

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const username = String(formData.get("username") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!username || !password) {
      setError("Please enter your username and password.")
      setLoading(false)
      return
    }

    try{

    let response = await axios.post(`${BACKEND_URL}/user/signin`, {
      username,
      password,
    })

    localStorage.setItem("token", response.data.jwt)
    setLoading(false)
    router.push("/dashboard")
  }catch (error) {
  console.error(error);
  setLoading(false);
  }
}
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 -z-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
        />

        <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col justify-between px-6 py-10 lg:px-12">
            <a href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold">Observo</span>
            </a>

            <div className="my-16 max-w-md">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                <span className="text-gray-300">Welcome back</span>
              </div>

              <h1 className="mb-6 text-4xl leading-tight font-bold md:text-5xl">
                Sign in to your
                <br />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  observability hub
                </span>
              </h1>

              <p className="mb-10 text-lg text-gray-400">
                Monitor uptime, latency, and incidents across every region from
                a single dashboard.
              </p>

              <ul className="space-y-3">
                {[
                  "Real-time uptime monitoring across regions",
                  "AI-powered incident grouping",
                  "Drill into latency and error rates instantly",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-gray-300"
                  >
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-cyan-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-gray-500">
              &copy; 2026 Observo. All rights reserved.
            </p>
          </div>

          <div className="flex items-center justify-center px-6 py-10 lg:px-12">
            <div className="w-full max-w-md">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
                <h2 className="mb-2 text-2xl font-bold">Sign in</h2>
                <p className="mb-8 text-sm text-gray-400">
                  Enter your credentials to access your dashboard.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="username"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="yourname"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-medium transition-all hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                  Don&apos;t have an account?{" "}
                  <a
                    href="/signup"
                    className="font-medium text-cyan-400 transition-colors hover:text-cyan-300"
                  >
                    Create one
                  </a>
                </p>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}
