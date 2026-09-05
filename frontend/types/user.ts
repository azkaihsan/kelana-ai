// ── User Profile ─────────────────────────────────────────────────────────────

/** Shape returned by GET /api/v1/auth/me */
export type UserProfile = {
  id: number;
  name: string;
  email: string;
  trip_count: number;
};
