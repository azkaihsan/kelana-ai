"use client";

import { useState } from "react";

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
            `Start early to beat the crowds at popular sites`,
            `Use local public transport to save on commute costs`,
            `Download offline maps before heading out`,
          ],
          local_food: [
            `Try the local street food at the main market`,
            `Visit a highly-rated neighborhood restaurant for dinner`,
            `Sample traditional breakfast at a local café`,
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
    <div className="min-h-screen bg-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* ── Input Card ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 shadow-sm bg-white p-6">
          <h1 className="text-center text-lg font-bold text-gray-800">
            KelanaAI
          </h1>
          <p className="text-center text-sm text-gray-400 mt-1 mb-6">
            Plan your next adventure
          </p>

          <div className="space-y-3">
            <FormField label="Destination:">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-transparent outline-none text-right text-gray-700 text-sm"
                placeholder="e.g. Japan"
              />
            </FormField>

            <FormField label="Budget:">
              <div className="flex items-center gap-1 justify-end w-full">
                <span className="text-sm text-gray-500">USD</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-24 bg-transparent outline-none text-right text-gray-700 text-sm"
                  placeholder="2000"
                />
              </div>
            </FormField>

            <FormField label="Days:">
              <input
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full bg-transparent outline-none text-right text-gray-700 text-sm"
                placeholder="5"
              />
            </FormField>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium py-3 flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner color="white" />
                Generating...
              </>
            ) : (
              <>
                <SparkleIcon />
                Generate AI Trip
              </>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 font-medium">Error: {error}</p>
              <p className="text-xs text-red-500 mt-1">
                Using fallback itinerary data.
              </p>
            </div>
          )}
        </div>

        {/* ── Loading State ─────────────────────────────────────────────── */}
        {loading && !itinerary && (
          <div className="mt-8">
            <h2 className="text-sm font-bold tracking-wide text-emerald-700 mb-3">
              AI RECOMMENDATION
            </h2>
            <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-6 flex flex-col items-center justify-center">
              <Spinner color="gray" size={6} />
              <p className="mt-3 text-sm font-medium text-gray-600">
                Generating itinerary...
              </p>
              <p className="text-xs text-gray-400 mt-1">
                This may take a moment
              </p>
            </div>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {itinerary && (
          <div className="mt-8">
            <h2 className="text-sm font-bold tracking-wide text-emerald-700 mb-3">
              AI RECOMMENDATION
            </h2>
            <div className="space-y-4">
              {itinerary.map((item) => (
                <DayCard key={item.day} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({ item }: { item: ItineraryDay }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Day header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-3">
        <p className="font-semibold text-white text-sm">{item.title}</p>
      </div>

      <div className="divide-y divide-gray-100">
        {/* ── Travel Tips ──────────────────────────────────────────────── */}
        <section className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <MapIcon />
            <span className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Travel Tips
            </span>
          </div>
          <ul className="space-y-1">
            {item.travel_tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Local Food Recommendations ───────────────────────────────── */}
        <section className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <ForkIcon />
            <span className="text-xs font-bold uppercase tracking-wide text-orange-600">
              Local Food
            </span>
          </div>
          <ul className="space-y-1">
            {item.local_food.map((food, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" />
                {food}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Budget Breakdown ─────────────────────────────────────────── */}
        <section className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <WalletIcon />
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Budget Breakdown
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <BudgetRow label="Accommodation" value={item.budget_breakdown.accommodation} />
            <BudgetRow label="Food" value={item.budget_breakdown.food} />
            <BudgetRow label="Transport" value={item.budget_breakdown.transport} />
            <BudgetRow label="Activities" value={item.budget_breakdown.activities} />
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700">Daily Total</span>
            <span className="text-sm font-bold text-emerald-700">
              {item.budget_breakdown.total}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function BudgetRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-700 text-right">{value}</span>
    </>
  );
}

// ── Shared UI Components ──────────────────────────────────────────────────────

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
        {label}
      </span>
      <div className="ml-3 flex-1 flex justify-end">{children}</div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
    </svg>
  );
}

function Spinner({
  color = "white",
  size = 4,
}: {
  color?: "white" | "gray" | "blue";
  size?: number;
}) {
  const colorClasses = {
    white: "text-white",
    gray: "text-gray-600",
    blue: "text-blue-600",
  };

  const sizeClass = `h-${size} w-${size}`;

  return (
    <svg
      className={`animate-spin ${sizeClass} ${colorClasses[color]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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

// ── Section Icons ─────────────────────────────────────────────────────────────

function MapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4 text-blue-600"
    >
      <path
        fillRule="evenodd"
        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.757.433 5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
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
      className="w-4 h-4 text-orange-500"
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
      className="w-4 h-4 text-emerald-600"
    >
      <path d="M1 4.25a3.733 3.733 0 012.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0016.75 2H3.25A2.25 2.25 0 001 4.25zM1 7.25a3.733 3.733 0 012.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0016.75 5H3.25A2.25 2.25 0 001 7.25zM7 8a1 1 0 000 2 2 2 0 012 2 1 1 0 102 0 2 2 0 012-2 1 1 0 100-2 2 2 0 01-2-2 1 1 0 10-2 0 2 2 0 01-2 2zM3.25 8H1v8.75C1 18.216 2.343 19.5 4 19.5h12c1.657 0 3-1.284 3-2.75V8H3.25z" />
    </svg>
  );
}