// ── Budget & Itinerary ──────────────────────────────────────────────────────

export type BudgetBreakdown = {
  accommodation: string;
  food: string;
  transport: string;
  activities: string;
  total: string;
};

export type ItineraryDay = {
  day: number;
  title: string;
  travel_tips: string[];
  local_food: string[];
  budget_breakdown: BudgetBreakdown;
};

// ── Trip Models ─────────────────────────────────────────────────────────────

/** Shape returned by GET /api/v1/trips and POST /api/v1/trips */
export type Trip = {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category: string;
  daily_budget: number;
  /** ISO-8601 timestamp from the backend `created_at` column. */
  created_at: string;
  ai_recommendation: string | null;
  /** ID of the user who owns this trip. */
  user_id: number | null;
};

/** Request payload for POST /api/v1/trips */
export type CreateTripPayload = {
  destination: string;
  days: number;
  budget: number;
};

/** Response from POST /api/v1/trips/{id}/generate */
export type AIRecommendationResponse = {
  trip_id: number;
  destination: string;
  recommendation: ItineraryDay[];
};
