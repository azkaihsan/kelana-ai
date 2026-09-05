"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useUser } from "@/context/UserContext";
import { fetchCurrentUser, isAuthenticated } from "@/services/authService";
import type { UserProfile } from "@/types/user";

// ── Profile Page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useUser();

  const [loading, setLoading] = useState(!user); // skip loading if context already hydrated
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guard: redirect to login if no token exists at all
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // If context is already hydrated, skip the fetch
    if (user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchCurrentUser()
      .then((data: UserProfile) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        // 401 → expired/invalid token → redirect to login
        if (err.message.startsWith("401")) {
          router.push("/login");
        } else {
          setError(err.message ?? "Failed to load profile.");
          setLoading(false);
        }
      });
  }, [router, user, setUser]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar variant="solid" />

      <main className="flex flex-1 flex-col items-center px-4 py-12 md:py-16">
        <div className="w-full max-w-xl">
          {/* ── Page heading ───────────────────────────────────────────────── */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Your account details and travel statistics.
            </p>
          </div>

          {/* ── Loading skeleton ───────────────────────────────────────────── */}
          {loading && <ProfileSkeleton />}

          {/* ── Error state ────────────────────────────────────────────────── */}
          {!loading && error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
            >
              <WarningIcon />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Failed to load profile
                </p>
                <p className="mt-0.5 text-xs text-red-500">{error}</p>
              </div>
            </div>
          )}

          {/* ── Profile data ───────────────────────────────────────────────── */}
          {!loading && !error && user && (
            <div className="space-y-4">
              {/* Avatar + name banner */}
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div
                  aria-hidden="true"
                  className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 text-2xl font-bold text-white shadow-md"
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">Kelana Traveller</p>
                </div>
              </div>

              {/* Detail cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <ProfileCard
                  icon={<UserIcon />}
                  label="Full Name"
                  value={user.name}
                />
                <ProfileCard
                  icon={<EmailIcon />}
                  label="Email Address"
                  value={user.email}
                />
                <ProfileCard
                  icon={<MapPinIcon />}
                  label="Total Trips"
                  value={String(user.trip_count)}
                  highlight
                />
              </div>

              {/* CTA */}
              <div className="flex justify-end pt-2">
                <a
                  href="/trips"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-sky-600 hover:to-emerald-600 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                >
                  <MapPinIcon white />
                  View My Trips
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfileCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border p-5 shadow-sm ${
        highlight
          ? "border-sky-200 bg-gradient-to-br from-sky-50 to-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          highlight ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-500"
        }`}
      >
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p
        className={`truncate text-base font-bold ${
          highlight ? "text-sky-700" : "text-gray-800"
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Loading profile…">
      {/* Avatar banner skeleton */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-16 w-16 flex-shrink-0 rounded-full bg-slate-200" />
        <div className="space-y-2">
          <div className="h-5 w-36 rounded-lg bg-slate-200" />
          <div className="h-3 w-24 rounded-lg bg-slate-100" />
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="h-9 w-9 rounded-xl bg-slate-200" />
            <div className="h-3 w-20 rounded-lg bg-slate-100" />
            <div className="h-5 w-28 rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
    </svg>
  );
}

function MapPinIcon({ white = false }: { white?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-5 w-5 ${white ? "text-white" : ""}`}
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
