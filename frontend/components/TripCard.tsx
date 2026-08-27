import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BudgetCategory = "Backpacker" | "Standard" | "Luxury";
export type TravelStyle = "Family" | "Solo" | "Couple";

export interface TripCardProps {
  id: string | number;
  title?: string;
  destination: string;
  countryCode?: string; // e.g. "ID", "JP", "US"
  budget: number;
  currency?: string; // Default: "USD"
  category: BudgetCategory | string;
  travelStyle?: TravelStyle;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  onClick?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts an ISO 3166-1 alpha-2 country code (e.g. "ID") into a flag emoji.
 * Works because flag emojis are encoded as Regional Indicator Symbol pairs.
 */
function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join("");
}

/**
 * Best-effort lookup: map common destination city/country names → ISO-2 code.
 * Extend as needed; falls back to null so a MapPin icon renders instead.
 */
const DESTINATION_TO_CODE: Record<string, string> = {
  indonesia: "ID",
  bali: "ID",
  jakarta: "ID",
  japan: "JP",
  tokyo: "JP",
  kyoto: "JP",
  "united states": "US",
  "new york": "US",
  paris: "FR",
  france: "FR",
  thailand: "TH",
  bangkok: "TH",
  singapore: "SG",
  malaysia: "MY",
  "kuala lumpur": "MY",
  australia: "AU",
  sydney: "AU",
  india: "IN",
  dubai: "AE",
  uae: "AE",
  london: "GB",
  "united kingdom": "GB",
  rome: "IT",
  italy: "IT",
  spain: "ES",
  barcelona: "ES",
  germany: "DE",
  berlin: "DE",
  korea: "KR",
  seoul: "KR",
  vietnam: "VN",
  "ho chi minh": "VN",
  hanoi: "VN",
  philippines: "PH",
  manila: "PH",
  maldives: "MV",
  turkey: "TR",
  istanbul: "TR",
  mexico: "MX",
  cancun: "MX",
  brazil: "BR",
  egypt: "EG",
  morocco: "MA",
  nepal: "NP",
  "sri lanka": "LK",
  cambodia: "KH",
  "siem reap": "KH",
};

function resolveFlag(
  countryCode?: string,
  destination?: string
): string | null {
  if (countryCode && countryCode.length === 2) {
    return countryCodeToFlag(countryCode);
  }
  if (destination) {
    const key = destination.toLowerCase();
    for (const [word, code] of Object.entries(DESTINATION_TO_CODE)) {
      if (key.includes(word)) return countryCodeToFlag(code);
    }
  }
  return null;
}

function formatBudget(budget: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(budget);
}

function formatDateRange(start?: string, end?: string): string | null {
  if (!start && !end) return null;
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const fmt = (d: string) =>
    new Intl.DateTimeFormat("en-US", opts).format(new Date(d));
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  if (end) return `Until ${fmt(end)}`;
  return null;
}

// ── Badge Config ──────────────────────────────────────────────────────────────

type CategoryStyle = {
  badge: string;
  dot: string;
};

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  Backpacker: {
    badge:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  Standard: {
    badge:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  Luxury: {
    badge:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  badge: "bg-slate-100 text-slate-700 border-slate-200",
  dot: "bg-slate-400",
};

function getCategoryStyle(category: string): CategoryStyle {
  const key =
    Object.keys(CATEGORY_STYLES).find(
      (k) => k.toLowerCase() === category.toLowerCase()
    ) ?? "";
  return CATEGORY_STYLES[key] ?? DEFAULT_CATEGORY_STYLE;
}

// Travel-style badge always uses neutral tones
const TRAVEL_STYLE_BADGE =
  "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";

// ── Component ─────────────────────────────────────────────────────────────────

export function TripCard({
  id,
  title,
  destination,
  countryCode,
  budget,
  currency = "USD",
  category,
  travelStyle,
  startDate,
  endDate,
  days,
  onClick,
}: TripCardProps) {
  const catStyle = getCategoryStyle(category);
  const flag = resolveFlag(countryCode, destination);
  const formattedBudget = formatBudget(budget, currency);
  const dateRange = formatDateRange(startDate, endDate);

  const cardLabel = `Trip to ${destination}${travelStyle ? ` · ${travelStyle}` : ""}`;

  return (
    <article
      aria-label={cardLabel}
      onClick={onClick}
      className={`group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-slate-300${
        onClick ? " cursor-pointer" : ""
      }`}
    >
      {/* ── Top row: destination + CTA ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: flag/icon + name */}
        <div className="flex min-w-0 items-center gap-2.5">
          {flag ? (
            <span
              className="flex-shrink-0 text-2xl leading-none"
              role="img"
              aria-label={`Flag for ${destination}`}
            >
              {flag}
            </span>
          ) : (
            <span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-50"
              aria-label={`Destination: ${destination}`}
            >
              <MapPinIcon className="h-4 w-4 text-sky-500" />
            </span>
          )}

          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-gray-900 group-hover:text-sky-700 transition-colors duration-150">
              {title || destination}
            </h3>
            {title && (
              <p className="truncate text-xs text-gray-400">{destination}</p>
            )}
          </div>
        </div>

        {/* View Details CTA */}
        <Link
          href={`/trips/${id}`}
          id={`trip-card-link-${id}`}
          className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-sky-700 hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          aria-label={`View details for trip to ${destination}`}
          onClick={(e) => e.stopPropagation()}
        >
          View Details
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── Budget row ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm">
        <WalletIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
        <span className="font-semibold text-gray-800">{formattedBudget}</span>
        {(days != null || dateRange) && (
          <span className="text-gray-400">·</span>
        )}
        {days != null && (
          <span className="text-gray-500">
            {days} {days === 1 ? "day" : "days"}
          </span>
        )}
        {dateRange && (
          <>
            {days != null && <span className="text-gray-400">·</span>}
            <span className="truncate text-gray-500">{dateRange}</span>
          </>
        )}
      </div>

      {/* ── Badges row ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${catStyle.badge}`}
          aria-label={`Budget category: ${category}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${catStyle.dot}`}
            aria-hidden="true"
          />
          {category}
        </span>

        {/* Travel style badge */}
        {travelStyle && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TRAVEL_STYLE_BADGE}`}
            aria-label={`Travel style: ${travelStyle}`}
          >
            <TravelStyleIcon style={travelStyle} />
            {travelStyle}
          </span>
        )}
      </div>
    </article>
  );
}

// ── Sub-component: Travel Style Icon ──────────────────────────────────────────

function TravelStyleIcon({ style }: { style: TravelStyle }) {
  if (style === "Family") return <UsersIcon className="h-3.5 w-3.5" />;
  if (style === "Couple") return <HeartIcon className="h-3.5 w-3.5" />;
  return <UserIcon className="h-3.5 w-3.5" />;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.003 3.5-4.697 3.5-8.083a8 8 0 10-16 0c0 3.386 1.555 6.08 3.5 8.083a19.583 19.583 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.625A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.625zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H5.25zm9 3.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z" />
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

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}
