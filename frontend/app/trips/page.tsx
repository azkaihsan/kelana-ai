"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { getTrips, deleteTrip, ForbiddenError } from "@/services/tripService";
import { TripCard } from "@/components/TripCard";
import { Pagination } from "@/components/Pagination";
import Navbar from "@/components/Navbar";
import { ToastContainer } from "@/components/ToastContainer";
import { useToast } from "@/lib/useToast";
import { useUser } from "@/context/UserContext";
import type { Trip } from "@/types/trip";

// ── Constants ─────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

// ── Types ─────────────────────────────────────────────────────────────────────

type SortMode = "latest" | "oldest" | "budget-desc" | "budget-asc";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TripsPage() {
  const { user } = useUser();
  const { toasts, showToast, dismissToast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, sort & pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("latest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getTrips()
      .then(setTrips)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load trips."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  // ── Delete handler ───────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (id: string | number) => {
      try {
        await deleteTrip(id);
        setTrips((prev) => prev.filter((t) => t.id !== id));
        showToast("Trip deleted successfully.", "success");
      } catch (err) {
        if (err instanceof ForbiddenError) {
          showToast("You do not have permission to modify this trip.", "error");
        } else {
          showToast(
            err instanceof Error ? err.message : "Failed to delete trip.",
            "error"
          );
        }
      }
    },
    [showToast]
  );


  // ── Combined filter + sort pipeline ─────────────────────────────────────────
  const filteredAndSortedTrips = useMemo(() => {
    return trips
      .filter((trip) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        const matchesDestination = trip.destination
          .toLowerCase()
          .includes(query);
        const matchesCategory = trip.category?.toLowerCase().includes(query);
        return matchesDestination || matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "latest":
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "oldest":
            return (
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
            );
          case "budget-desc":
            return b.budget - a.budget;
          case "budget-asc":
            return a.budget - b.budget;
          default:
            return 0;
        }
      });
  }, [trips, searchQuery, sortBy]);

  // ── Pagination derived state ──────────────────────────────────────────────
  const totalPages = Math.ceil(filteredAndSortedTrips.length / ITEMS_PER_PAGE);

  const paginatedTrips = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTrips.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedTrips, currentPage]);

  // Reset to page 1 whenever filters or sort order change.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== "" || sortBy !== "latest";

  function clearFilters() {
    setSearchQuery("");
    setSortBy("latest");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <Navbar variant="solid" />

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Trip History</h1>
          {!loading && !error && (
            <p className="mt-1 text-sm text-gray-500">
              {trips.length === 0
                ? "No saved itineraries"
                : `${trips.length} saved ${trips.length === 1 ? "itinerary" : "itineraries"}`}
            </p>
          )}
        </div>

        {/* ── Search & Sort Controls ────────────────────────────────────── */}
        {!loading && !error && trips.length > 0 && (
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search input */}
            <div className="relative flex-1">
              <span
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400"
                aria-hidden="true"
              >
                <SearchIcon />
              </span>
              <input
                id="trip-search"
                type="text"
                placeholder="Search trips by destination or style..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                aria-label="Search trips"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <XIcon />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative shrink-0">
              <span
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400"
                aria-hidden="true"
              >
                <SortIcon />
              </span>
              <select
                id="trip-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortMode)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm text-gray-700 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                aria-label="Sort trips"
              >
                <option value="latest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="budget-desc">Highest budget</option>
                <option value="budget-asc">Lowest budget</option>
              </select>
              {/* Custom caret */}
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
                <ChevronDownIcon />
              </span>
            </div>
          </div>
        )}

        {/* ── Loading Skeleton ─────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-3" aria-label="Loading trips" aria-busy="true">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[76px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        )}

        {/* ── Error State ──────────────────────────────────────────────── */}
        {!loading && error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
          >
            <WarningIcon />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Failed to load trips
              </p>
              <p className="mt-0.5 text-xs text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* ── Empty State (no trips at all) ─────────────────────────────── */}
        {!loading && !error && trips.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <EmptyStateIllustration />
            <h2 className="mt-6 text-xl font-bold text-gray-900">
              No trips found
            </h2>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              You haven&apos;t generated any itineraries yet. Plan your next
              adventure today!
            </p>
            <Link
              href="/"
              id="create-first-trip-btn"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-sky-700 hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
            >
              <PlusIcon />
              Create Your First Trip
            </Link>
          </div>
        )}

        {/* ── No Search Results ─────────────────────────────────────────── */}
        {!loading &&
          !error &&
          trips.length > 0 &&
          filteredAndSortedTrips.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"
                aria-hidden="true"
              >
                <NoResultsIcon />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-gray-900">
                No trips match your search criteria.
              </h2>
              <p className="mt-1.5 max-w-xs text-sm text-gray-500">
                Try a different destination or travel style, or reset your
                filters.
              </p>
              <button
                id="clear-filters-btn"
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-150 hover:bg-slate-50 hover:border-slate-400 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
              >
                <XIcon />
                Clear filters
              </button>
            </div>
          )}

        {/* ── Trip List ────────────────────────────────────────────────── */}
        {!loading && !error && filteredAndSortedTrips.length > 0 && (
          <>
            {/* Result count badge — shows filter match count when a filter is active */}
            {hasActiveFilters && (
              <p className="mb-3 text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {filteredAndSortedTrips.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {trips.length}
                </span>{" "}
                {trips.length === 1 ? "trip" : "trips"}
              </p>
            )}

            <ul className="space-y-3" aria-label="Saved trips">
              {paginatedTrips.map((trip) => (
                <li key={trip.id}>
                  <TripCard
                    id={trip.id}
                    destination={trip.destination}
                    days={trip.days}
                    budget={trip.budget}
                    category={trip.category}
                    isOwner={user?.id != null && trip.user_id === user.id}
                    onDelete={handleDelete}
                  />
                </li>
              ))}
            </ul>

            {/* ── Pagination controls ──────────────────────────────── */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAndSortedTrips.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              itemLabel="trip"
            />
          </>
        )}
      </main>

      {/* ── Toast notifications ─────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ── Icons & Illustrations ─────────────────────────────────────────────────────

function EmptyStateIllustration() {
  return (
    <div
      className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-50"
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-12 w-12 text-sky-400"
      >
        {/* Plane */}
        <path d="M22 2L11 13" />
        <path d="M22 2L15 22l-4-9-9-4 19-7z" />
      </svg>
    </div>
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

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  );
}

function SearchIcon() {
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
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

function ChevronDownIcon() {
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
        d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function NoResultsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8 text-slate-400"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M8 11h6" />
    </svg>
  );
}
