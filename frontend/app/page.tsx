"use client";

import { useState } from "react";
import Image from "next/image";

// ── Types ────────────────────────────────────────────────────────────────────

type BudgetBreakdown = {
  accommodation: string;
  food: string;
  transport: string;
  activities: string;
  total: string;
};

type ItineraryDay = {
  day: number;
  title: string;
  travel_tips: string[];
  local_food: string[];
  budget_breakdown: BudgetBreakdown;
};

type TripResponse = {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category: string;
  daily_budget: number;
  ai_recommendation: string | null;
};

type AIRecommendationResponse = {
  trip_id: number;
  destination: string;
  recommendation: ItineraryDay[];
};

// ── Constants ────────────────────────────────────────────────────────────────

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80&auto=format&fit=crop";

const FOOTER_NAV_LINKS: { label: string; href: string }[] = [
  { label: "Explore", href: "#" },
  { label: "Destinations", href: "#" },
  { label: "About", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms", href: "#" },
];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [destination, setDestination] = useState("Japan");
  const [budget, setBudget] = useState("2000");
  const [days, setDays] = useState("5");
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setItinerary(null);
    setError(null);

    try {
      // Step 1: Create a new trip
      const tripResponse = await fetch("http://localhost:8000/api/v1/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days: parseInt(days),
          budget: parseFloat(budget),
        }),
      });

      if (!tripResponse.ok) {
        const errorData = await tripResponse.json();
        throw new Error(
          `Failed to create trip: ${errorData.detail || tripResponse.statusText}`
        );
      }

      const trip: TripResponse = await tripResponse.json();

      // Step 2: Generate AI recommendations for the created trip
      const aiResponse = await fetch(
        `http://localhost:8000/api/v1/trips/${trip.id}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(
          `Failed to generate AI recommendations: ${errorData.detail || aiResponse.statusText}`
        );
      }

      const aiRecommendation: AIRecommendationResponse = await aiResponse.json();

      // Step 3: The recommendation is already a structured list
      setItinerary(aiRecommendation.recommendation);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error generating trip:", err);

      // Fallback mock data with proper structure
      const numDays = Math.max(1, parseInt(days || "1", 10));
      const generated: ItineraryDay[] = Array.from(
        { length: numDays },
        (_, i) => ({
          day: i + 1,
          title: `Day ${i + 1}: Exploring ${destination}`,
          travel_tips: [
            "Start early to beat the crowds at popular sites",
            "Use local public transport to save on commute costs",
            "Download offline maps before heading out",
          ],
          local_food: [
            "Try the local street food at the main market",
            "Visit a highly-rated neighborhood restaurant for dinner",
            "Sample traditional breakfast at a local café",
          ],
          budget_breakdown: {
            accommodation: "~$50/night — mid-range guesthouse",
            food: "~$30 — street food + one sit-down meal",
            transport: "~$10 — subway / bus day pass",
            activities: "~$20 — entrance fees & tours",
            total: "~$110 total",
          },
        })
      );
      setItinerary(generated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* ── Header / Nav ──────────────────────────────────────────────────── */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <GlobeIcon />
          <span className="text-lg font-bold tracking-tight text-white drop-shadow">
            KelanaAI
          </span>
        </div>
        <nav aria-label="Primary navigation" className="hidden gap-6 md:flex">
          {["Explore", "Destinations", "About"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm font-medium text-white/80 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {item}
            </a>
          ))}
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        {/* ── Hero Section ────────────────────────────────────────────────── */}
        <section
          aria-label="Hero — discover your next destination"
          className="relative h-[520px] w-full md:h-[600px]"
        >
          {/* Hero image */}
          <Image
            src={HERO_IMAGE_URL}
            alt="Aerial view of a scenic travel destination with lush mountains and clear blue water"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />

          {/* Dark gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />

          {/* Hero headline */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm">
              <SparkleIcon />
              AI-Powered Travel
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg md:text-5xl lg:text-6xl">
              Plan Your Perfect
              <br />
              <span className="bg-gradient-to-r from-sky-300 to-emerald-300 bg-clip-text text-transparent">
                Adventure
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base font-medium text-white/80 md:text-lg">
              Enter your destination, budget, and trip length — let AI craft a
              personalised day-by-day itinerary in seconds.
            </p>
          </div>
        </section>

        {/* ── Search / Input Form ─────────────────────────────────────────── */}
        <section
          aria-label="Trip planner form"
          className="relative z-10 -mt-14 px-4 md:px-8"
        >
          <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/60 bg-white/95 p-5 shadow-2xl backdrop-blur-md md:p-8">
            <h2 className="mb-1 text-lg font-semibold text-gray-800">
              Plan my trip
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Fill in the details below and get your AI itinerary instantly.
            </p>

            {/* Responsive form grid */}
            <div className="flex flex-col gap-3 md:grid md:grid-cols-4 md:gap-4">
              {/* Destination */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label
                  htmlFor="destination"
                  className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Destination
                </label>
                <div className="flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-4 py-2 transition-all duration-200 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                  <MapIcon />
                  <input
                    id="destination"
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    placeholder="e.g. Japan, Bali, Paris…"
                    aria-label="Travel destination"
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="budget"
                  className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Budget (USD)
                </label>
                <div className="flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-4 py-2 transition-all duration-200 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                  <span className="text-sm font-medium text-gray-400">$</span>
                  <input
                    id="budget"
                    type="number"
                    value={budget}
                    min={0}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    placeholder="2000"
                    aria-label="Trip budget in USD"
                  />
                </div>
              </div>

              {/* Days */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="days"
                  className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Duration (days)
                </label>
                <div className="flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-4 py-2 transition-all duration-200 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                  <CalendarIcon />
                  <input
                    id="days"
                    type="number"
                    value={days}
                    min={1}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    placeholder="5"
                    aria-label="Number of travel days"
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              id="generate-trip-btn"
              onClick={handleGenerate}
              disabled={loading}
              className="mt-5 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-sky-600 hover:to-emerald-600 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Spinner color="white" />
                  Generating your itinerary…
                </>
              ) : (
                <>
                  <SparkleIcon />
                  Generate AI Trip
                </>
              )}
            </button>

            {/* Error notice */}
            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <WarningIcon />
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Something went wrong
                  </p>
                  <p className="mt-0.5 text-xs text-red-500">{error}</p>
                  <p className="mt-0.5 text-xs text-red-400">
                    Showing fallback itinerary data instead.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Results / Loading ────────────────────────────────────────────── */}
        <section
          aria-label="AI-generated itinerary"
          className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 md:px-8"
        >
          {loading && !itinerary && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 shadow-sm">
              <Spinner color="blue" size={8} />
              <p className="mt-4 text-sm font-semibold text-gray-700">
                Crafting your personalised itinerary…
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Hang tight, this usually takes 10–20 seconds.
              </p>
            </div>
          )}

          {itinerary && (
            <>
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                  <CheckIcon />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-700">
                  AI Recommendation — {itinerary.length}-Day Itinerary
                </h2>
              </div>
              <div className="space-y-5">
                {itinerary.map((item) => (
                  <DayCard key={item.day} item={item} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-8 md:flex-row md:justify-between md:px-8">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <GlobeIcon className="text-sky-500" />
            <span className="text-sm font-bold text-gray-800">KelanaAI</span>
          </div>

          {/* Nav links */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {FOOTER_NAV_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-gray-500 transition-colors duration-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} KelanaAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({ item }: { item: ItineraryDay }) {
  return (
    <article
      aria-label={`Itinerary for ${item.title}`}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      {/* Day header */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-4">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
          {item.day}
        </span>
        <p className="font-semibold text-white">{item.title}</p>
      </div>

      <div className="divide-y divide-slate-100">
        {/* Travel Tips */}
        <section className="px-5 py-4" aria-label="Travel tips">
          <div className="mb-3 flex items-center gap-2">
            <MapIcon />
            <span className="text-xs font-bold uppercase tracking-wide text-sky-700">
              Travel Tips
            </span>
          </div>
          <ul className="space-y-1.5">
            {item.travel_tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {/* Local Food */}
        <section className="px-5 py-4" aria-label="Local food recommendations">
          <div className="mb-3 flex items-center gap-2">
            <ForkIcon />
            <span className="text-xs font-bold uppercase tracking-wide text-orange-600">
              Local Food
            </span>
          </div>
          <ul className="space-y-1.5">
            {item.local_food.map((food, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" />
                {food}
              </li>
            ))}
          </ul>
        </section>

        {/* Budget Breakdown */}
        <section className="px-5 py-4" aria-label="Budget breakdown">
          <div className="mb-3 flex items-center gap-2">
            <WalletIcon />
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Budget Breakdown
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <BudgetRow label="Accommodation" value={item.budget_breakdown.accommodation} />
            <BudgetRow label="Food" value={item.budget_breakdown.food} />
            <BudgetRow label="Transport" value={item.budget_breakdown.transport} />
            <BudgetRow label="Activities" value={item.budget_breakdown.activities} />
          </dl>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5">
            <span className="text-xs font-bold text-gray-700">Daily Total</span>
            <span className="text-sm font-bold text-emerald-700">
              {item.budget_breakdown.total}
            </span>
          </div>
        </section>
      </div>
    </article>
  );
}

function BudgetRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-right text-xs text-gray-700">{value}</dd>
    </>
  );
}

// ── Shared UI Components ──────────────────────────────────────────────────────

function Spinner({
  color = "white",
  size = 4,
}: {
  color?: "white" | "gray" | "blue";
  size?: number;
}) {
  const colorClasses: Record<string, string> = {
    white: "text-white",
    gray: "text-gray-600",
    blue: "text-sky-600",
  };

  return (
    <svg
      className={`animate-spin h-${size} w-${size} ${colorClasses[color]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SparkleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
    </svg>
  );
}

function GlobeIcon({ className = "text-white" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`h-6 w-6 ${className}`}
      aria-hidden="true"
    >
      <path d="M21.721 12.752a9.711 9.711 0 00-.945-5.003 12.754 12.754 0 01-4.339 2.708 18.991 18.991 0 01-.214 4.772 17.165 17.165 0 005.498-2.477zM14.634 15.55a17.324 17.324 0 00.332-4.647c-.952.227-1.945.347-2.966.347-1.021 0-2.014-.12-2.966-.347a17.515 17.515 0 00.332 4.647 17.385 17.385 0 005.268 0zM9.772 17.119a18.963 18.963 0 004.456 0A17.182 17.182 0 0112 21.724a17.18 17.18 0 01-2.228-4.605zM7.777 15.23a18.87 18.87 0 01-.214-4.774 12.753 12.753 0 01-4.34-2.708 9.711 9.711 0 00-.944 5.004 17.165 17.165 0 005.498 2.477zM21.356 14.752a9.765 9.765 0 01-7.478 6.817 18.64 18.64 0 001.988-4.718 18.627 18.627 0 005.49-2.098zM2.644 14.752c1.682.971 3.53 1.688 5.49 2.099a18.64 18.64 0 001.988 4.718 9.765 9.765 0 01-7.478-6.816zM13.878 2.43a9.755 9.755 0 016.116 3.986 11.267 11.267 0 01-3.746 2.504 18.63 18.63 0 00-2.37-6.49zM12 2.276a17.152 17.152 0 012.805 7.121c-.897.23-1.837.353-2.805.353-.968 0-1.908-.122-2.805-.353A17.151 17.151 0 0112 2.276zM10.122 2.43a18.629 18.629 0 00-2.37 6.49 11.266 11.266 0 01-3.746-2.504 9.754 9.754 0 016.116-3.985z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 flex-shrink-0 text-sky-600"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.757.433 5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 flex-shrink-0 text-sky-600"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 flex-shrink-0 text-orange-500"
      aria-hidden="true"
    >
      <path d="M9.25 2a.75.75 0 01.75.75v.56a2.25 2.25 0 011.5 2.19v.5h.25a.75.75 0 010 1.5h-.25v7a.75.75 0 01-1.5 0v-7H9.5v7a.75.75 0 01-1.5 0v-7H7.75a.75.75 0 010-1.5H8v-.5a2.25 2.25 0 011.5-2.19V2.75A.75.75 0 019.25 2zM13 2.75a.75.75 0 011.5 0v4.971a2.25 2.25 0 01-1.5 2.12V14.5a.75.75 0 01-1.5 0V9.84a2.25 2.25 0 01-1.5-2.12V2.75a.75.75 0 011.5 0v4.5h1.5v-4.5z" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 flex-shrink-0 text-emerald-600"
      aria-hidden="true"
    >
      <path d="M1 4.25a3.733 3.733 0 012.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0016.75 2H3.25A2.25 2.25 0 001 4.25zM1 7.25a3.733 3.733 0 012.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0016.75 5H3.25A2.25 2.25 0 001 7.25zM7 8a1 1 0 000 2 2 2 0 012 2 1 1 0 102 0 2 2 0 012-2 1 1 0 100-2 2 2 0 01-2-2 1 1 0 10-2 0 2 2 0 01-2 2zM3.25 8H1v8.75C1 18.216 2.343 19.5 4 19.5h12c1.657 0 3-1.284 3-2.75V8H3.25z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 text-emerald-600"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}
