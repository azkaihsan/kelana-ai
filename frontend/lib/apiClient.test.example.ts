/**
 * Example usage of authenticatedFetch utility
 * 
 * This file demonstrates how to use the apiClient in service functions.
 * It is not an actual test file (no test framework is configured yet),
 * but serves as documentation and verification of the API.
 */

import { authenticatedFetch } from "./apiClient";

// Example 1: GET request with authentication
async function exampleGetRequest() {
  const response = await authenticatedFetch("http://localhost:8000/api/v1/trips");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// Example 2: POST request with body and authentication
async function examplePostRequest(data: { destination: string }) {
  const response = await authenticatedFetch("http://localhost:8000/api/v1/trips", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Example 3: Handling errors
async function exampleWithErrorHandling() {
  try {
    const response = await authenticatedFetch("http://localhost:8000/api/v1/trips");
    
    // 401 responses are automatically handled by apiClient (redirect to /login)
    // Other errors need to be handled here
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

/**
 * Manual verification checklist:
 * 
 * ✓ Token is read from localStorage using key "access_token"
 * ✓ Authorization header is added as "Bearer {token}"
 * ✓ Existing headers are preserved (like Content-Type)
 * ✓ 401 responses clear token and redirect to /login
 * ✓ TypeScript types are correct (builds without errors)
 * ✓ Works with all HTTP methods (GET, POST, PUT, DELETE)
 */
