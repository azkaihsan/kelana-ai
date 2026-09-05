const TOKEN_KEY = "access_token";

/**
 * Authenticated fetch wrapper that automatically adds JWT token to requests.
 * 
 * Features:
 * - Reads JWT token from localStorage (key: "access_token")
 * - Adds Authorization header as "Bearer {token}" if token exists
 * - Handles 401 responses by clearing token and redirecting to /login
 * - Preserves all standard fetch options
 * 
 * @param url - The request URL
 * @param options - Standard fetch options (method, headers, body, etc.)
 * @returns The fetch Response object
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get token from localStorage (only available in browser, not during SSR)
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  // Merge Authorization header with existing headers
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Add Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make the request with augmented headers
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized responses (browser-only: localStorage and redirect are not available on the server)
  if (response.status === 401 && typeof window !== "undefined") {
    // Clear the invalid token
    localStorage.removeItem(TOKEN_KEY);
    // Redirect to login page
    window.location.href = "/login";
  }

  return response;
}
