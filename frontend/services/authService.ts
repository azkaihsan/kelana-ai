const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const TOKEN_KEY = "access_token";

// ── Types ────────────────────────────────────────────────────────────────────

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
}

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

// ── Auth API Calls ───────────────────────────────────────────────────────────

/**
 * Login with email and password.
 * Stores the JWT token in localStorage on success.
 */
export async function login(email: string, password: string): Promise<void> {
  const payload: LoginPayload = { email, password };
  
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<AuthResponse>(res);
  localStorage.setItem(TOKEN_KEY, data.access_token);
}

/**
 * Register a new user account.
 * Stores the JWT token in localStorage on success.
 */
export async function register(
  name: string,
  email: string,
  password: string
): Promise<void> {
  const payload: RegisterPayload = { name, email, password };
  
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<AuthResponse>(res);
  localStorage.setItem(TOKEN_KEY, data.access_token);
}

/**
 * Logout the current user by clearing the token from localStorage.
 */
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Retrieve the JWT token from localStorage.
 * Returns null if no token is stored.
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Check if a valid token exists in localStorage.
 * Note: This only checks for token presence, not validity.
 * The backend validates the token on each request.
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  return token !== null && token.length > 0;
}

/**
 * Fetch the current authenticated user's profile from the backend.
 * Calls GET /api/v1/auth/me with the stored JWT token.
 * Throws if the token is missing/invalid (401) or network fails.
 */
export async function fetchCurrentUser(): Promise<{
  id: number;
  name: string;
  email: string;
  trip_count: number;
}> {
  const token = getToken();
  if (!token) {
    throw new Error("401: No token stored");
  }

  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return handleResponse<{ id: number; name: string; email: string; trip_count: number }>(
    res
  );
}
