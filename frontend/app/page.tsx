"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createTrip, generateTrip } from "@/services/tripService";

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
  const router = useRouter();

  const [destination, setDestination] = useState("Japan");
  const [budget, setBudget] = useState("2000");
  const [days, setDays] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create a new trip record
      const trip = await createTrip({
        destination: destination.trim(),
        days: parseInt(days, 10),
        budget: parseFloat(budget),
      });

      // Step 2: Generate AI itinerary for the created trip
      await generateTrip(trip.id);

      // Step 3: Redirect to trip history on success
      router.push("/trips");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      console.error("Error generating trip:", err);
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
          <a
            href="/trips"
            className="text-sm font-medium text-white/80 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            My Trips
          </a>
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
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Loading overlay while generating ────────────────────────────── */}
        {loading && (
          <section
            aria-live="polite"
            aria-label="Generation status"
            className="mx-auto w-full max-w-4xl px-4 pb-8 pt-10 md:px-8"
          >
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 shadow-sm">
              <Spinner color="blue" size={8} />
              <p className="mt-4 text-sm font-semibold text-gray-700">
                Crafting your personalised itinerary…
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Hang tight, this usually takes 10–20 seconds.
              </p>
            </div>
          </section>
        )}

        {/* Spacer so footer sits at bottom when form is the only content */}
        {!loading && <div className="flex-1" />}
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
