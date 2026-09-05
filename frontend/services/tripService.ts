import type {
  Trip,
  CreateTripPayload,
  AIRecommendationResponse,
} from "@/types/trip";
import { authenticatedFetch } from "@/lib/apiClient";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
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
