"use client";

import { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console or error reporting service
    console.error("Unhandled error captured by error.tsx:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar variant="solid" />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-full max-w-md">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-red-700 border border-red-200 mb-6">
            <AlertCircleIcon />
            <span>500 • Unexpected Error</span>
          </div>

          {/* Error Visual Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/20">
            <WrenchIcon />
          </div>

          {/* Heading & Friendly Copy */}
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            We hit unexpected turbulence
          </h1>
          <p className="mt-3 text-base text-gray-600 leading-relaxed">
            Something went wrong on our end while preparing this page. Our travel
            engine encountered a hiccup, but you can retry or head back home.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              <RefreshIcon />
              <span>Try Again</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              <HomeIcon />
              <span>Return to Home</span>
            </Link>
          </div>

          {/* Technical Details (Collapsed by default) */}
          {error?.message && (
            <details className="mt-8 text-left rounded-lg border border-slate-200 bg-white p-3.5 text-xs text-slate-500 shadow-2xs">
              <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900 focus-visible:outline-none">
                Error details (for developers)
              </summary>
              <div className="mt-2.5 font-mono text-[11px] text-red-600 break-all bg-slate-50 p-2.5 rounded border border-slate-100">
                {error.message}
                {error.digest && (
                  <p className="mt-1 text-slate-400">Digest: {error.digest}</p>
                )}
              </div>
            </details>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} KelanaAI. All rights reserved.
      </footer>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function AlertCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 text-red-600"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-10 w-10 text-white"
      aria-hidden="true"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function RefreshIcon() {
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
        d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.31V15a.75.75 0 01-1.5 0v-3.25A.75.75 0 015 11h3.25a.75.75 0 010 1.5H6.62l.37.37a4 4 0 105.77-5.32.75.75 0 111.06-1.06 5.5 5.5 0 011.492 4.934z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function HomeIcon() {
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
        d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
        clipRule="evenodd"
      />
    </svg>
  );
}
