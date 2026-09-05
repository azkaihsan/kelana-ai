import type {
  Trip,
  CreateTripPayload,
  AIRecommendationResponse,
} from "@/types/trip";
import { authenticatedFetch } from "@/lib/apiClient";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Errors ────────────────────────────────────────────────────────────────────

/**
 * Thrown when a mutating request is rejected with 403 Forbidden.
 * Callers should catch this separately to show a permission-denied message.
 */
export class ForbiddenError extends Error {
  constructor() {
    super("You do not have permission to modify this trip.");
    this.name = "ForbiddenError";
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 403) {
    throw new ForbiddenError();
  }
  if (!res.ok) {
    let detail: string = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

// ── Trip API Calls ────────────────────────────────────────────────────────────

/** Fetch the full list of saved trips. */
export async function getTrips(): Promise<Trip[]> {
  const res = await authenticatedFetch(`${API_BASE}/trips`, { cache: "no-store" });
  return handleResponse<Trip[]>(res);
}

/** Fetch a single trip by ID. Returns null on 404. */
export async function getTripById(id: string | number): Promise<Trip | null> {
  const res = await authenticatedFetch(`${API_BASE}/trips/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  return handleResponse<Trip>(res);
}

/** Create a new trip and return the saved record. */
export async function createTrip(payload: CreateTripPayload): Promise<Trip> {
  const res = await authenticatedFetch(`${API_BASE}/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Trip>(res);
}

/**
 * Update an existing trip by ID.
 * Throws ForbiddenError if the server returns 403.
 */
export async function updateTrip(
  id: string | number,
  payload: Partial<CreateTripPayload>
): Promise<Trip> {
  const res = await authenticatedFetch(`${API_BASE}/trips/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Trip>(res);
}

/**
 * Delete a trip by ID.
 * Throws ForbiddenError if the server returns 403.
 */
export async function deleteTrip(id: string | number): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/trips/${id}`, {
    method: "DELETE",
  });
  await handleResponse<{ message: string }>(res);
}

/**
 * Trigger AI itinerary generation for an existing trip.
 * POST /api/v1/trips/{tripId}/generate
 */
export async function generateTrip(
  tripId: string | number
): Promise<AIRecommendationResponse> {
  const res = await authenticatedFetch(`${API_BASE}/trips/${tripId}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<AIRecommendationResponse>(res);
}
