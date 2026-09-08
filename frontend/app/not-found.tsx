import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar variant="solid" />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-full max-w-md">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 border border-sky-200 mb-6">
            <CompassIcon />
            <span>404 • Destination Not Found</span>
          </div>

          {/* Compass Icon Visual */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
            <LostMapIcon />
          </div>

          {/* Heading & Subtext */}
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Off the beaten path
          </h1>
          <p className="mt-3 text-base text-gray-600 leading-relaxed">
            The page you are looking for hasn&apos;t been charted yet, or the journey
            link has moved. Let&apos;s get you back on track!
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              <HomeIcon />
              <span>Return to Home</span>
            </Link>

            <Link
              href="/trips"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              <LuggageIcon />
              <span>Explore My Trips</span>
            </Link>
          </div>
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

function CompassIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 text-sky-600"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 00-.53 1.28l4.25 4.25a.75.75 0 001.06 0l4.25-4.25a.75.75 0 00-.53-1.28h-8.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LostMapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-10 w-10 text-white"
      aria-hidden="true"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
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

function LuggageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 text-slate-500"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v1.5h1.5A2.75 2.75 0 0118.25 8v7.5A2.75 2.75 0 0115.5 18.25h-11A2.75 2.75 0 011.75 15.5V8A2.75 2.75 0 014.5 5.25H6v-1.5zm2.5 0a1.25 1.25 0 011.25-1.25h2.5a1.25 1.25 0 011.25 1.25v1.5h-5v-1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}
