"use client"
import { useRouter } from "next/navigation"

import { useIsSignedIn, useSignOut } from "@/hooks/useAuthToken"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f] text-white">
      <Navigation />
      <Hero />
      <Logos />
      <Features />
      <Metrics />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  )
}

function Navigation() {
  const router = useRouter()
  const isSignedIn = useIsSignedIn()
  const handleSignOut = useSignOut()

  return (
    <nav className="glass fixed top-0 right-0 left-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
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
            </button>
            <div className="hidden items-center gap-6 md:flex">
              <a
                href="#features"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Pricing
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <>
                <button
                  type="button"
                  className="hidden rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 sm:block"
                  onClick={() => router.push("/dashboard")}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="hidden text-sm text-gray-400 transition-colors hover:text-white sm:block"
                  onClick={() => router.push("/signin")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium transition-all hover:from-cyan-400 hover:to-blue-500"
                  onClick={() => router.push("/signup")}
                >
                  Start Free Trial
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-20">
      <div className="grid-bg absolute inset-0 opacity-50" />
      <div className="bg-gradient-radial pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 from-cyan-500/10 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-gray-300">
              Now with AI-Powered Incident Detection
            </span>
          </div>

          <h1 className="mb-6 text-5xl leading-tight font-bold md:text-7xl">
            All-in-One
            <br />
            <span className="text-gradient">Observability Platform</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-400">
            Monitor, alert, and investigate incidents in minutes. Consolidate
            your logs, metrics, traces, and incidents into one powerful
            platform.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#"
              className="animate-pulse-glow w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-medium transition-all hover:from-cyan-400 hover:to-blue-500 sm:w-auto"
            >
              Start Free Trial
            </a>
            <a
              href="#"
              className="glass glass-hover flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 font-medium transition-all sm:w-auto"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Watch Demo
            </a>
          </div>
        </div>

        <div className="relative mt-16">
          <div className="glass mx-auto max-w-5xl rounded-2xl p-1">
            <div className="rounded-xl bg-[#0d0d15] p-4 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-4 text-xs text-gray-500">
                  dashboard.observo.io
                </span>
              </div>
              <DashboardPreview />
            </div>
          </div>
          <div className="pointer-events-none absolute right-0 -bottom-4 left-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
        </div>
      </div>
    </section>
  )
}

function DashboardPreview() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="glass rounded-lg p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">Total Requests</span>
          <span className="text-xs text-green-400">+12.5%</span>
        </div>
        <div className="mb-2 text-2xl font-bold">2.4M</div>
        <div className="flex h-12 items-end gap-1">
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-cyan-500/50 to-cyan-500"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
      <div className="glass rounded-lg p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">Error Rate</span>
          <span className="text-xs text-red-400">+0.2%</span>
        </div>
        <div className="mb-2 text-2xl font-bold">0.12%</div>
        <div className="flex h-12 items-end gap-1">
          {[20, 15, 25, 12, 18, 22, 15].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-red-500/50 to-red-500"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
      <div className="glass rounded-lg p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">P95 Latency</span>
          <span className="text-xs text-green-400">-8ms</span>
        </div>
        <div className="mb-2 text-2xl font-bold">142ms</div>
        <div className="flex h-12 items-end gap-1">
          {[180, 160, 150, 165, 145, 140, 142].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-blue-500/50 to-blue-500"
              style={{ height: `${h / 2}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Logos() {
  return (
    <section className="border-y border-white/5 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="mb-8 text-center text-sm text-gray-500">
          Trusted by engineering teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-40 md:gap-16">
          {["Vercel", "Stripe", "Linear", "Notion", "Figma", "Supabase"].map(
            (name) => (
              <div key={name} className="text-xl font-semibold text-gray-400">
                {name}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      title: "Unified Logs",
      description:
        "Aggregate logs from all your services in one place. Search across millions of entries in seconds.",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      title: "Real-time Metrics",
      description:
        "Custom dashboards with real-time metrics streaming. Alert on anomalies before they impact users.",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ),
      title: "Distributed Tracing",
      description:
        "Trace requests across microservices. Identify bottlenecks with end-to-end visibility.",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
      title: "Smart Alerting",
      description:
        "AI-powered alert grouping reduces noise by 95%. Get notified only when it matters.",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Incident Management",
      description:
        "Built-in incident timeline and runbooks. Collaborate with your team to resolve issues faster.",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      title: "AI Insights",
      description:
        "Automatic anomaly detection and root cause analysis. Let AI find the patterns you might miss.",
    },
  ]

  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold">
            Everything you need to observe
          </h2>
          <p className="text-xl text-gray-400">
            One platform for all your observability needs
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="glass glass-hover group cursor-pointer rounded-2xl p-6 transition-all"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 transition-colors group-hover:from-cyan-500/30 group-hover:to-blue-500/30">
                <div className="text-cyan-400">{feature.icon}</div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Metrics() {
  return (
    <section className="relative px-6 py-24">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          <div>
            <div className="text-gradient mb-2 text-4xl font-bold md:text-5xl">
              99.99%
            </div>
            <div className="text-gray-400">Uptime SLA</div>
          </div>
          <div>
            <div className="text-gradient mb-2 text-4xl font-bold md:text-5xl">
              10x
            </div>
            <div className="text-gray-400">Faster Debugging</div>
          </div>
          <div>
            <div className="text-gradient mb-2 text-4xl font-bold md:text-5xl">
              95%
            </div>
            <div className="text-gray-400">Noise Reduction</div>
          </div>
          <div>
            <div className="text-gradient mb-2 text-4xl font-bold md:text-5xl">
              500K+
            </div>
            <div className="text-gray-400">Users Trust Us</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Connect Your Services",
      description:
        "Use our agent, API, or integrations to send logs and metrics from any source.",
    },
    {
      step: "02",
      title: "Configure Alerts",
      description:
        "Set up intelligent alerts that learn your system patterns and notify the right team.",
    },
    {
      step: "03",
      title: "Investigate Fast",
      description:
        "Use AI-powered search and correlation to find issues before users report them.",
    },
  ]

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold">Up and running in minutes</h2>
          <p className="text-xl text-gray-400">No complex setup required</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {i < steps.length - 1 && (
                <div className="absolute top-8 left-1/2 hidden h-0.5 w-full bg-gradient-to-r from-cyan-500/50 to-blue-500/50 md:block" />
              )}
              <div className="glass relative rounded-2xl p-8">
                <div className="text-gradient mb-4 text-6xl font-bold opacity-30">
                  {step.step}
                </div>
                <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "0",
      description: "For side projects and small teams",
      features: [
        "1M log events/month",
        "3-day retention",
        "Basic alerting",
        "1 team member",
      ],
      cta: "Start Free",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "49",
      description: "For growing engineering teams",
      features: [
        "50M log events/month",
        "30-day retention",
        "Smart alerting",
        "Unlimited team members",
        "AI anomaly detection",
        "Custom dashboards",
      ],
      cta: "Start Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large-scale deployments",
      features: [
        "Unlimited log events",
        "1-year retention",
        "SSO / SAML",
        "Dedicated support",
        "SLA guarantees",
        "On-premise option",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-400">Start free, scale as you grow</p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-2xl p-8 ${plan.highlighted ? "border border-cyan-500/30 bg-gradient-to-b from-cyan-500/20 to-blue-500/20" : "glass"}`}
            >
              {plan.highlighted && (
                <div className="mb-4 text-xs font-medium tracking-wide text-cyan-400">
                  MOST POPULAR
                </div>
              )}
              <h3 className="mb-2 text-xl font-semibold">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                {plan.price !== "Custom" && (
                  <span className="text-gray-400">/month</span>
                )}
              </div>
              <p className="mb-6 text-sm text-gray-400">{plan.description}</p>
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-cyan-400"
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
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className={`block w-full rounded-xl px-6 py-3 text-center font-medium transition-all ${plan.highlighted ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500" : "glass glass-hover"}`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const testimonials = [
    {
      quote:
        "Observo cut our incident response time by 80%. The AI-powered alert grouping is a game changer.",
      author: "Sarah Chen",
      role: "Head of Engineering, Scaleup.io",
      avatar: "SC",
    },
    {
      quote:
        "Finally, a single place for all our observability needs. No more context switching between tools.",
      author: "Marcus Rodriguez",
      role: "CTO, DeployHQ",
      avatar: "MR",
    },
    {
      quote:
        "The search across logs is incredibly fast. Found a bug in minutes that would have taken hours before.",
      author: "Emily Watson",
      role: "Senior SRE, FinTech Inc",
      avatar: "EW",
    },
  ]

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold">Loved by engineers</h2>
          <p className="text-xl text-gray-400">
            Join thousands of teams building better software
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div key={i} className="glass rounded-2xl p-8">
              <div className="mb-4 flex gap-1 text-cyan-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="h-5 w-5 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-6 text-gray-300">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-medium">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.author}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="glass relative overflow-hidden rounded-3xl p-12 text-center">
          <div className="bg-gradient-radial pointer-events-none absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 from-cyan-500/20 via-transparent to-transparent" />
          <div className="relative">
            <h2 className="mb-4 text-4xl font-bold">
              Ready to see everything?
            </h2>
            <p className="mb-8 text-xl text-gray-400">
              Start your free trial today. No credit card required.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#"
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-medium transition-all hover:from-cyan-400 hover:to-blue-500 sm:w-auto"
              >
                Start Free Trial
              </a>
              <a
                href="#"
                className="glass glass-hover w-full rounded-xl px-8 py-4 font-medium transition-all sm:w-auto"
              >
                Talk to Sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
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
            </div>
            <p className="text-sm text-gray-500">
              Making observability simple for everyone.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-400">
              Product
            </h4>
            <ul className="space-y-2">
              {[
                "Features",
                "Pricing",
                "Integrations",
                "Changelog",
                "Roadmap",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-gray-500 transition-colors hover:text-white"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-400">
              Resources
            </h4>
            <ul className="space-y-2">
              {[
                "Documentation",
                "API Reference",
                "Guides",
                "Blog",
                "Status",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-gray-500 transition-colors hover:text-white"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-400">
              Company
            </h4>
            <ul className="space-y-2">
              {["About", "Careers", "Press", "Contact", "Partners"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 transition-colors hover:text-white"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-400">Legal</h4>
            <ul className="space-y-2">
              {["Privacy", "Terms", "Security", "GDPR"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-gray-500 transition-colors hover:text-white"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-sm text-gray-500">
            &copy; 2026 Observo. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-gray-500 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.291-.205-8.09-2.266-10.639-5.433-1.127 1.935-1.77 4.192-1.77 6.594 0 4.552 2.316 8.56 5.832 10.912-2.137-.067-4.147-.672-5.9-1.681v.177c0 5.438 3.872 9.974 9 11.1-1.07.292-2.193.444-3.36.444-.826 0-1.635-.078-2.42-.227 1.638 3.337 5.083 5.74 9.567 5.842-3.512 2.754-7.938 4.395-12.746 4.395-.842 0-1.67-.052-2.479-.157 4.54 2.911 9.935 4.612 15.724 4.612 18.865 0 29.182-15.636 29.182-29.182 0-.444-.01-.887-.032-1.327 2.003-1.445 3.741-3.25 5.114-5.303z" />
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-500 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-500 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
