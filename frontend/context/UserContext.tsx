"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { UserProfile } from "@/types/user";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserContextValue {
  /** The authenticated user's profile, or null if not logged in. */
  user: UserProfile | null;
  /** Replace the stored user profile (called after login / /me fetch). */
  setUser: (user: UserProfile | null) => void;
  /** Clear user state (called on logout). */
  clearUser: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);

  const setUser = (u: UserProfile | null) => setUserState(u);
  const clearUser = () => setUserState(null);

  return (
    <UserContext.Provider value={{ user, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Access the global user state.
 * Must be used inside a <UserProvider>.
 */
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (ctx === undefined) {
    throw new Error("useUser must be used within a <UserProvider>");
  }
  return ctx;
}
