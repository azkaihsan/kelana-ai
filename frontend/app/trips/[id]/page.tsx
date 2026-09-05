"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getTripById, deleteTrip, ForbiddenError } from "@/services/tripService";
import Navbar from "@/components/Navbar";
import { ToastContainer } from "@/components/ToastContainer";
import { useToast } from "@/lib/useToast";
import { useUser } from "@/context/UserContext";
import type { Trip, ItineraryDay } from "@/types/trip";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { toasts, showToast, dismissToast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    async function fetchTrip() {
      try {
        const data = await getTripById(id);
        if (!data) {
          router.replace("/not-found");
          return;
        }
        setTrip(data);

        // Parse ai_recommendation JSON string → ItineraryDay[] | null
        if (data.ai_recommendation) {
          try {
            setItinerary(JSON.parse(data.ai_recommendation) as ItineraryDay[]);
          } catch {
            setItinerary(null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trip.");
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [id, router]);

  // ── Delete handler ───────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!trip) return;
    setDeleting(true);
    try {
      await deleteTrip(trip.id);
      router.push("/trips");
    } catch (err) {
      setDeleting(false);
      setConfirmDelete(false);
      if (err instanceof ForbiddenError) {
        showToast("You do not have permission to modify this trip.", "error");
      } else {
        showToast(
          err instanceof Error ? err.message : "Failed to delete trip.",
          "error"
        );
      }
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-gray-400 animate-pulse">Loading trip…</p>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <p className="text-sm font-semibold text-red-500">{error ?? "Trip not found."}</p>
        <Link href="/trips" className="text-sm text-sky-600 hover:underline">
          ← Back to Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <Navbar variant="solid" />

      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* ── Back link ──────────────────────────────────────────────────── */}
        <Link
          href="/trips"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 rounded"
          aria-label="Back to Trip History"
        >
          <ArrowLeftIcon />
          Back to Trips
        </Link>

        {/* ── Destination heading + owner actions ─────────────────────────── */}
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {trip.destination}
          </h1>

          {/* Only render action buttons if current user owns the trip */}
          {user?.id != null && trip.user_id === user.id && (
            <div className="flex items-center gap-2">
              {/* Edit button */}
              <Link
                href={`/trips/${id}/edit`}
                id="trip-detail-edit-btn"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all duration-150 hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
              >
                <PencilIcon />
                Edit
              </Link>

              {/* Delete button */}
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Are you sure?</span>
                  <button
                    type="button"
                    id="trip-detail-delete-confirm-btn"
                    disabled={deleting}
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-red-700 disabled:opacity-60 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all duration-150 hover:bg-slate-50 disabled:opacity-60 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="trip-detail-delete-btn"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all duration-150 hover:border-red-300 hover:text-red-600 hover:bg-red-50 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                >
                  <TrashIcon />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Info grid ───────────────────────────────────────────────────── */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoCard label="DESTINATION" value={trip.destination} />
          <InfoCard label="BUDGET" value={`USD ${trip.budget.toLocaleString()}`} />
          <InfoCard
            label="CATEGORY"
            value={
              <CategoryBadge category={trip.category} />
            }
          />
          <InfoCard
            label="DAYS"
            value={`${trip.days} ${trip.days === 1 ? "day" : "days"}`}
          />
        </div>

        {/* ── AI Recommendation section ────────────────────────────────────── */}
        <section aria-label="AI Recommendation" className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
              AI Recommendation
            </span>
            <div className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </div>

          {itinerary && itinerary.length > 0 ? (
            <div className="space-y-3">
              {itinerary.map((day) => (
                <DayAccordion key={day.day} item={day} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <p className="text-sm font-semibold text-gray-500">
                No AI recommendation generated yet.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Go back and regenerate this trip to create an itinerary.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* ── Toast notifications ─────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-sky-600">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    standard: "bg-sky-100 text-sky-700",
    backpacker: "bg-orange-100 text-orange-700",
    luxury: "bg-emerald-100 text-emerald-700",
  };
  const key = category.toLowerCase();
  const cls = colorMap[key] ?? "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {category}
    </span>
  );
}

/** Expandable day card — summary line visible, full details on click */
function DayAccordion({ item }: { item: ItineraryDay }) {
  // Derive a short preview from the title
  const preview = item.title.replace(/^Day \d+[:\-–]?\s*/i, "");

  return (
    <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm open:shadow-md transition-shadow duration-200">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 rounded-2xl">
        <span className="flex h-8 w-14 flex-shrink-0 items-center gap-1">
          <span className="text-sm font-bold text-sky-600">Day {item.day}</span>
        </span>
        <span className="flex-1 truncate text-sm text-gray-700">{preview}</span>
        <ChevronIcon />
      </summary>

      <div className="divide-y divide-slate-100 border-t border-slate-100">
        {/* Travel Tips */}
        {item.travel_tips?.length > 0 && (
          <section className="px-5 py-4" aria-label="Travel tips">
            <SectionHeader icon={<MapPinIcon />} label="Travel Tips" color="text-sky-700" />
            <ul className="mt-2 space-y-1.5">
              {item.travel_tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <Bullet color="bg-sky-400" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Local Food */}
        {item.local_food?.length > 0 && (
          <section className="px-5 py-4" aria-label="Local food recommendations">
            <SectionHeader icon={<ForkIcon />} label="Local Food" color="text-orange-600" />
            <ul className="mt-2 space-y-1.5">
              {item.local_food.map((food, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <Bullet color="bg-orange-400" />
                  {food}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Budget Breakdown */}
        {item.budget_breakdown && (
          <section className="px-5 py-4" aria-label="Budget breakdown">
            <SectionHeader icon={<WalletIcon />} label="Budget Breakdown" color="text-emerald-700" />
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5">
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
        )}
      </div>
    </details>
  );
}

function SectionHeader({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className={`text-xs font-bold uppercase tracking-wide ${color}`}>
        {label}
      </span>
    </div>
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

function Bullet({ color }: { color: string }) {
  return (
    <span
      className={`mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full ${color}`}
      aria-hidden="true"
    />
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
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
        d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MapPinIcon() {
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

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
    </svg>
  );
}

function TrashIcon() {
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
        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

