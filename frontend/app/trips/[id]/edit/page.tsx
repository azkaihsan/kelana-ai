"use client";

import { useEffect, useState, useMemo, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getTripById, updateTrip, ForbiddenError } from "@/services/tripService";
import { isAuthenticated, fetchCurrentUser } from "@/services/authService";
import { useUser } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import { ToastContainer } from "@/components/ToastContainer";
import { useToast } from "@/lib/useToast";
import type { Trip } from "@/types/trip";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEstimatedCategory(budget: number): {
  name: string;
  badgeClass: string;
  dotClass: string;
} {
  if (budget < 1000) {
    return {
      name: "Backpacker",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      dotClass: "bg-emerald-500",
    };
  }
  if (budget <= 3000) {
    return {
      name: "Standard",
      badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
      dotClass: "bg-sky-500",
    };
  }
  return {
    name: "Luxury",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
  };
}

// ── Edit Page ─────────────────────────────────────────────────────────────────

export default function EditTripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, setUser } = useUser();
  const { toasts, showToast, dismissToast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form inputs
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState("");

  // ── Authentication & Initial Data Fetch ─────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    if (!user) {
      fetchCurrentUser()
        .then(setUser)
        .catch((err: Error) => {
          if (err.message?.startsWith("401")) {
            router.push("/login");
          }
        });
    }

    getTripById(id)
      .then((data) => {
        if (!data) {
          setFetchError("Trip not found.");
          setInitialLoading(false);
          return;
        }
        setTrip(data);
        setDestination(data.destination);
        setBudget(String(data.budget));
        setDays(String(data.days));
        setInitialLoading(false);
      })
      .catch((err: Error) => {
        setFetchError(err.message ?? "Failed to load trip details.");
        setInitialLoading(false);
      });
  }, [id, router, user, setUser]);

  // ── Ownership Verification ──────────────────────────────────────────────────
  const isOwner = useMemo(() => {
    if (!trip || !user) return true; // optimistic while user loads
    return trip.user_id === user.id;
  }, [trip, user]);

  // ── Derived metrics for live preview ────────────────────────────────────────
  const parsedBudget = parseFloat(budget) || 0;
  const parsedDays = parseInt(days, 10) || 0;
  const calculatedDailyBudget =
    parsedDays > 0 ? parsedBudget / parsedDays : 0;
  const categoryInfo = getEstimatedCategory(parsedBudget);

  // ── Form submission handler ─────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedDestination = destination.trim();
    if (!trimmedDestination) {
      setFormError("Please enter a valid destination.");
      return;
    }

    if (isNaN(parsedDays) || parsedDays < 1) {
      setFormError("Duration must be at least 1 day.");
      return;
    }

    if (isNaN(parsedBudget) || parsedBudget < 0) {
      setFormError("Budget must be a non-negative number.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await updateTrip(id, {
        destination: trimmedDestination,
        days: parsedDays,
        budget: parsedBudget,
      });

      showToast("Trip updated successfully!", "success");

      // Redirect back to trip details
      setTimeout(() => {
        router.push(`/trips/${id}`);
      }, 500);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        setFormError("You do not have permission to modify this trip.");
        showToast("You do not have permission to modify this trip.", "error");
      } else {
        const message =
          err instanceof Error ? err.message : "Failed to update trip.";
        setFormError(message);
        showToast(message, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <Navbar variant="solid" />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
        {/* ── Breadcrumb / Back Link ──────────────────────────────────────── */}
        <Link
          href={`/trips/${id}`}
          className="inline-flex items-center gap-1.5 rounded text-sm text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          aria-label="Back to trip details"
        >
          <ArrowLeftIcon />
          Back to Trip Details
        </Link>

        {/* ── Loading Skeleton ───────────────────────────────────────────── */}
        {initialLoading && (
          <div className="mt-6 space-y-6" aria-busy="true">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-slate-200" />
            <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" />
          </div>
        )}

        {/* ── Error State (Fetch / Not Found) ─────────────────────────────── */}
        {!initialLoading && fetchError && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-white px-6 py-14 text-center">
            <WarningIcon className="h-10 w-10 text-red-500" />
            <h2 className="mt-4 text-lg font-bold text-gray-900">
              {fetchError}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              The trip you are trying to edit could not be found or loaded.
            </p>
            <Link
              href="/trips"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              Back to Trips
            </Link>
          </div>
        )}

        {/* ── Forbidden / Unauthorized Ownership Alert ─────────────────────── */}
        {!initialLoading && !fetchError && trip && !isOwner && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <WarningIcon className="mx-auto h-8 w-8 text-amber-600" />
            <h2 className="mt-2 text-base font-bold text-amber-900">
              Permission Denied
            </h2>
            <p className="mt-1 text-sm text-amber-700">
              You do not have permission to modify this trip because it belongs
              to another user.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href={`/trips/${id}`}
                className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 shadow-sm transition hover:bg-amber-50"
              >
                View Trip Details
              </Link>
              <Link
                href="/trips"
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
              >
                Back to All Trips
              </Link>
            </div>
          </div>
        )}

        {/* ── Edit Form Card ──────────────────────────────────────────────── */}
        {!initialLoading && !fetchError && trip && isOwner && (
          <div className="mt-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                Edit Trip
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Update your trip destination, length, or budget settings.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
              aria-label="Edit trip form"
            >
              {/* Form error alert */}
              {formError && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                >
                  <WarningIcon className="h-5 w-5 flex-shrink-0 text-red-500" />
                  <div className="text-sm text-red-700">
                    <p className="font-semibold">Unable to save changes</p>
                    <p className="mt-0.5 text-xs text-red-600">{formError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Destination Input */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="destination-input"
                    className="text-xs font-semibold uppercase tracking-wider text-gray-600"
                  >
                    Destination
                  </label>
                  <div className="flex min-h-[46px] items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 transition-all duration-200 focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                    <MapIcon />
                    <input
                      id="destination-input"
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Tokyo, Japan"
                      required
                      disabled={saving}
                      className="w-full bg-transparent text-sm font-medium text-gray-800 placeholder-gray-400 outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    The primary city, country, or region for this itinerary.
                  </p>
                </div>

                {/* Duration and Budget Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Budget Input */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="budget-input"
                      className="text-xs font-semibold uppercase tracking-wider text-gray-600"
                    >
                      Total Budget (USD)
                    </label>
                    <div className="flex min-h-[46px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 transition-all duration-200 focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                      <span className="text-sm font-bold text-gray-400">$</span>
                      <input
                        id="budget-input"
                        type="number"
                        min={0}
                        step="any"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="2000"
                        required
                        disabled={saving}
                        className="w-full bg-transparent text-sm font-medium text-gray-800 placeholder-gray-400 outline-none"
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      Estimated total expenditure.
                    </p>
                  </div>

                  {/* Duration (days) Input */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="days-input"
                      className="text-xs font-semibold uppercase tracking-wider text-gray-600"
                    >
                      Duration (Days)
                    </label>
                    <div className="flex min-h-[46px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 transition-all duration-200 focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                      <CalendarIcon />
                      <input
                        id="days-input"
                        type="number"
                        min={1}
                        step={1}
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        placeholder="5"
                        required
                        disabled={saving}
                        className="w-full bg-transparent text-sm font-medium text-gray-800 placeholder-gray-400 outline-none"
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      Number of days traveling.
                    </p>
                  </div>
                </div>

                {/* ── Real-time calculated preview box ──────────────────────── */}
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Live Calculation Preview
                  </span>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Estimated Category</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryInfo.badgeClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${categoryInfo.dotClass}`}
                            aria-hidden="true"
                          />
                          {categoryInfo.name}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Daily Budget</p>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        ${calculatedDailyBudget.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs font-normal text-gray-500">
                          / day
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Form Actions ────────────────────────────────────────────── */}
              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  href={`/trips/${id}`}
                  id="cancel-edit-btn"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  id="save-trip-btn"
                  disabled={saving}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition duration-200 hover:from-sky-600 hover:to-emerald-600 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                >
                  {saving ? (
                    <>
                      <Spinner />
                      Saving changes…
                    </>
                  ) : (
                    <>
                      <CheckIcon />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ── Toast Notifications ─────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ── Icons & Helpers ───────────────────────────────────────────────────────────

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

function WarningIcon({ className = "h-5 w-5 text-red-500" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
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

function CheckIcon() {
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
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white"
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
