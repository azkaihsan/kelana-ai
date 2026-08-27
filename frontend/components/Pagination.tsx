"use client";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PaginationProps {
  /** The currently active page (1-indexed). */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Total number of items across all pages. */
  totalItems: number;
  /** Number of items displayed per page. */
  itemsPerPage: number;
  /** Callback fired when the user selects a different page. */
  onPageChange: (page: number) => void;
  /** Singular label for the item noun, e.g. "trip". Defaults to "item". */
  itemLabel?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Builds the list of page tokens to render.
 * Numbers represent clickable page buttons; `"ellipsis-start"` / `"ellipsis-end"`
 * represent the … separators.
 */
function buildPageTokens(
  currentPage: number,
  totalPages: number
): Array<number | "ellipsis-start" | "ellipsis-end"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const tokens: Array<number | "ellipsis-start" | "ellipsis-end"> = [];

  // Always show first page
  tokens.push(1);

  if (currentPage > 3) {
    tokens.push("ellipsis-start");
  }

  // Pages around the current page
  const rangeStart = Math.max(2, currentPage - 1);
  const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

  for (let p = rangeStart; p <= rangeEnd; p++) {
    tokens.push(p);
  }

  if (currentPage < totalPages - 2) {
    tokens.push("ellipsis-end");
  }

  // Always show last page
  tokens.push(totalPages);

  return tokens;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = "item",
}: PaginationProps) {
  // Don't render anything when there is only one (or zero) pages.
  if (totalPages <= 1) return null;

  const rangeStart = (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(currentPage * itemsPerPage, totalItems);
  const pluralLabel = totalItems === 1 ? itemLabel : `${itemLabel}s`;
  const tokens = buildPageTokens(currentPage, totalPages);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className="mt-6 flex flex-col items-center gap-3"
    >
      {/* Range summary */}
      <p className="text-xs text-gray-500" aria-live="polite">
        Showing{" "}
        <span className="font-semibold text-gray-700">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-gray-700">{totalItems}</span>{" "}
        {pluralLabel}
      </p>

      {/* Controls row */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <PageButton
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          ariaLabel="Previous page"
        >
          <ChevronLeftIcon />
        </PageButton>

        {/* Page tokens */}
        {tokens.map((token, idx) => {
          if (token === "ellipsis-start" || token === "ellipsis-end") {
            return (
              <span
                key={`${token}-${idx}`}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center text-sm text-gray-400 select-none"
                aria-hidden="true"
              >
                &hellip;
              </span>
            );
          }

          const isActive = token === currentPage;
          return (
            <button
              key={token}
              type="button"
              onClick={() => handlePageChange(token)}
              disabled={isActive}
              aria-label={`Page ${token}`}
              aria-current={isActive ? "page" : undefined}
              className={[
                "min-h-[36px] min-w-[36px] rounded-xl text-sm font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1",
                isActive
                  ? "bg-sky-600 text-white font-semibold shadow-sm cursor-default"
                  : "bg-white border border-slate-200 text-gray-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.95]",
              ].join(" ")}
            >
              {token}
            </button>
          );
        })}

        {/* Next button */}
        <PageButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          ariaLabel="Next page"
        >
          <ChevronRightIcon />
        </PageButton>
      </div>
    </nav>
  );
}

// ── Sub-component: Prev / Next arrow button ────────────────────────────────────

interface PageButtonProps {
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}

function PageButton({ onClick, disabled, ariaLabel, children }: PageButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        "min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border border-slate-200 bg-white",
        "text-sm text-gray-700 transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:bg-slate-50 hover:border-slate-300 active:scale-[0.95]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
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
        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRightIcon() {
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
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}
