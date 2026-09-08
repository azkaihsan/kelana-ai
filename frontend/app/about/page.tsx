import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "About — KelanaAI",
  description:
    "Learn more about KelanaAI, your intelligent AI-powered companion for effortless travel planning and curated itineraries.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar variant="solid" />

      <main className="flex-1">
        {/* ── Hero Section ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-sky-700 border border-sky-200 mb-6">
              <SparkleIcon />
              <span>About Kelana AI</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Travel smarter,{" "}
              <span className="bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-transparent">
                wander further
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 leading-relaxed">
              Derived from the Indonesian and Malay word <span className="italic font-semibold text-gray-800">&ldquo;Kelana&rdquo;</span>—meaning <em>to wander, roam, or embark on a journey</em>—KelanaAI brings the thrill of exploration back to travel planning.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                <CompassIcon />
                <span>Start Planning Now</span>
              </Link>
              <Link
                href="/trips"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-xs transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                <span>View My Trips</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Mission & Vision ────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Why KelanaAI?
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Vacation planning is often overwhelmed by dozens of open browser tabs,
                  confusing flight combinations, scattered blog reviews, and budget
                  uncertainties.
                </p>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  KelanaAI combines modern generative AI models with intuitive travel
                  heuristics. Within moments, you receive a tailored, day-by-day itinerary
                  calibrated specifically to your destination, your timeline, and your
                  exact budget.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <StarIcon />
                  <span>Our Core Principles</span>
                </h3>
                <ul className="space-y-3.5 text-sm text-gray-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon />
                    <span><strong>Simplicity first:</strong> No complex forms. Just tell us where, how long, and your budget.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon />
                    <span><strong>Actionable itineraries:</strong> Real activities, realistic timing, and balanced pacing.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon />
                    <span><strong>Dynamic assistance:</strong> An interactive AI assistant ready to adapt your trip on the fly.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircleIcon />
                    <span><strong>Personal control:</strong> You own your plans—save, tweak, re-generate, and organize trips effortlessly.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── What You Can Do (Features Grid) ─────────────────────────────── */}
        <section className="border-t border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Features Designed for Wanderers
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Everything you need to turn inspiration into an unforgettable adventure
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 transition-shadow hover:shadow-md">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-sky-600 text-white">
                  <MapPinIcon />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  AI-Powered Itineraries
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Receive structured, day-by-day schedules complete with morning,
                  afternoon, and evening highlights tailored to your destination.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 transition-shadow hover:shadow-md">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-600 text-white">
                  <ChatBubbleIcon />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  Intelligent Travel Assistant
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Got questions on local cuisine, packing recommendations, or culture?
                  Chat with your AI companion anytime.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 transition-shadow hover:shadow-md">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <CalendarCheckIcon />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  Trip Management & History
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Keep all your plans organized in one central dashboard. Review past journeys,
                  edit details, or plan your next escape.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                How It Works
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                From idea to itinerary in three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-lg border border-sky-200">
                  1
                </div>
                <h3 className="font-semibold text-gray-900">Set Your Parameters</h3>
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  Enter where you want to go, your travel duration, and your estimated budget.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-lg border border-sky-200">
                  2
                </div>
                <h3 className="font-semibold text-gray-900">AI Generates Your Plan</h3>
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  Our models craft an optimal day-by-day schedule with curated spots and pacing.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-lg border border-sky-200">
                  3
                </div>
                <h3 className="font-semibold text-gray-900">Explore & Travel</h3>
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  Review your itinerary, ask your AI travel assistant questions, and set off!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Call To Action Banner ───────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-sky-600 to-indigo-700 py-12 text-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to start your next adventure?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-sky-100">
              Join fellow travelers who use KelanaAI to make every trip unforgettable.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-sky-700 shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-700"
              >
                <CompassIcon />
                <span>Create Your First Trip</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm font-bold text-gray-800">KelanaAI</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <Link href="/trips" className="hover:text-gray-900 transition-colors">My Trips</Link>
            <Link href="/chat" className="hover:text-gray-900 transition-colors">Chat</Link>
            <Link href="/about" className="hover:text-gray-900 transition-colors font-medium text-sky-600">About</Link>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} KelanaAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SparkleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 text-sky-600"
      aria-hidden="true"
    >
      <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zm0 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 16zm9-6a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0119 10zm-15 0a.75.75 0 01-.75.75H1.75a.75.75 0 010-1.5h1.5A.75.75 0 014 10zM15.657 4.343a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm-9.192 9.192a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm9.192 1.06a.75.75 0 01-1.06 0l-1.06-1.06a.75.75 0 011.06-1.06l1.06 1.06a.75.75 0 010 1.06zm-9.192-9.192a.75.75 0 01-1.06 0L4.343 4.343a.75.75 0 011.06-1.06l1.06 1.06a.75.75 0 010 1.06z" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 00-.53 1.28l4.25 4.25a.75.75 0 001.06 0l4.25-4.25a.75.75 0 00-.53-1.28h-8.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5 text-amber-500"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CalendarCheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}
