import Link from "next/link";

// ── Props ────────────────────────────────────────────────────────────────────

export interface TripCardProps {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category: string;
}

// ── Category Badge Config ─────────────────────────────────────────────────────

type BadgeStyle = {
  bg: string;
  text: string;
  iconBg: string;
  iconColor: string;
};

const CATEGORY_STYLES: Record<string, BadgeStyle> = {
  Backpacker: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  Luxury: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  Standard: {
    bg: "bg-sky-100",
    text: "text-sky-700",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
};

const DEFAULT_STYLE: BadgeStyle = {
  bg: "bg-slate-100",
  text: "text-slate-700",
  iconBg: "bg-slate-100",
  iconColor: "text-slate-500",
};

function getCategoryStyle(category: string): BadgeStyle {
  const normalised =
    Object.keys(CATEGORY_STYLES).find(
      (k) => k.toLowerCase() === category.toLowerCase()
    ) ?? "";
  return CATEGORY_STYLES[normalised] ?? DEFAULT_STYLE;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TripCard({ id, destination, days, budget, category }: TripCardProps) {
  const style = getCategoryStyle(category);

  return (
    <article
      aria-label={`Trip to ${destination}`}
      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      {/* Airplane icon */}
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${style.iconBg}`}
        aria-hidden="true"
      >
        <AirplaneIcon className={`h-5 w-5 ${style.iconColor}`} />
      </div>

      {/* Trip info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold text-gray-900 truncate">
            {destination}
          </h3>
          {/* Category badge */}
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}
          >
            {category}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">
          {days} {days === 1 ? "day" : "days"} &middot; USD {budget.toLocaleString()} &middot; {category}
        </p>
      </div>

      {/* View Details CTA */}
      <Link
        href={`/trips/${id}`}
        id={`trip-card-link-${id}`}
        className="flex-shrink-0 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-sky-700 hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
        aria-label={`View details for trip to ${destination}`}
      >
        View Details
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </article>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function AirplaneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
        clipRule="evenodd"
      />
    </svg>
  );
}
