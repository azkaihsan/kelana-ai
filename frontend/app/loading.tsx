import Image from "next/image";
import faviconLogo from "@/public/favicon.ico";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16"
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Glow Ring Behind Logo */}
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-sky-500/20 blur-md animate-pulse" />
          
          {/* Outer spinning ring */}
          <div className="absolute -inset-2 rounded-2xl border-2 border-dashed border-sky-400/50 animate-spin" style={{ animationDuration: "6s" }} />

          {/* Logo container */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2.5 shadow-md border border-slate-100">
            <Image
              src={faviconLogo}
              alt="KelanaAI Loading"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
          </div>
        </div>

        {/* Loading Spinner & Label */}
        <div className="flex items-center gap-2.5 text-sky-600 mb-2">
          <svg
            className="h-5 w-5 animate-spin text-sky-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="text-base font-semibold text-gray-800">
            Loading KelanaAI...
          </span>
        </div>

        {/* Friendly travel hint */}
        <p className="text-xs text-gray-500">
          Mapping out your journey & preparing the route
        </p>
      </div>
    </div>
  );
}
