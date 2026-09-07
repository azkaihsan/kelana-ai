"use client";

import { useState, useEffect, FormEvent } from "react";
import Navbar from "@/components/Navbar";
import { askQuestion } from "@/services/assistantService";
import { isAuthenticated, fetchCurrentUser } from "@/services/authService";
import { useUser } from "@/context/UserContext";
import type { AskResult } from "@/types/assistant";

const SUGGESTED_QUESTIONS = [
  "Can I bring medication into Japan?",
  "What documents do I need for a tourist visa?",
  "What is the duty-free allowance for visitors?",
];

// ── Page Component ──────────────────────────────────────────────────────────

export default function AssistantPage() {
  const { user, setUser } = useUser();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<AskResult | null>(null);

  // Attempt to hydrate user context if token exists (silent)
  useEffect(() => {
    if (isAuthenticated() && !user) {
      fetchCurrentUser()
        .then(setUser)
        .catch(() => {
          // Ignore background auth error on public assistant
        });
    }
  }, [user, setUser]);

  const handleAsk = async (questionToAsk: string) => {
    const trimmed = questionToAsk.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await askQuestion(trimmed);
      setCurrentResult(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to retrieve an answer. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleAsk(query);
  };

  const selectSuggested = (q: string) => {
    setQuery(q);
    handleAsk(q);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar variant="solid" />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 md:py-14">
        {/* ── Title & Subtitle ─────────────────────────────────────────── */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#0e1b2e] md:text-3xl">
            Ask KelanaAI
          </h1>
          <p className="mt-1 text-sm text-[#7a8aa0] md:text-base">
            Powered by your trusted travel documents
          </p>
        </header>

        {/* ── Ask Input Bar ───────────────────────────────────────────── */}
        <form onSubmit={onSubmit} className="relative">
          <div className="flex items-center rounded-2xl border border-[#cbd5e1] bg-[#f4f8fb] p-2 transition-all focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-200">
            <input
              id="assistant-query-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Can I bring medication into Japan?"
              disabled={loading}
              className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-800 placeholder:italic placeholder:text-[#6f7b8c] focus:outline-none md:text-base"
              aria-label="Ask a travel question"
            />
            <button
              id="assistant-ask-btn"
              type="submit"
              disabled={loading || !query.trim()}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-[#076bba] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#065b9e] disabled:cursor-not-allowed disabled:opacity-50 md:text-base cursor-pointer"
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Asking...</span>
                </>
              ) : (
                <>
                  <span>Ask</span>
                  <SendAirplaneIcon />
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Suggested Questions ─────────────────────────────────────── */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Suggestions:</span>
          {SUGGESTED_QUESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => selectSuggested(item)}
              disabled={loading}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>

        {/* ── Error Banner ────────────────────────────────────────────── */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">Unable to fetch answer</p>
                <p className="mt-1 text-xs text-red-600">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => handleAsk(query)}
                disabled={!query.trim() || loading}
                className="ml-4 rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-800 transition-colors hover:bg-red-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── AI Answer Card (Mockup Match) ────────────────────────────── */}
        {currentResult && (
          <article
            aria-label="AI grounded answer"
            className="mt-6 rounded-lg bg-[#3ea291] p-6 text-white shadow-sm transition-all md:p-8"
          >
            {/* AI Answer Section */}
            <div>
              <h2 className="text-xs font-bold tracking-wider text-white uppercase md:text-sm">
                AI ANSWER
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white md:text-base">
                {currentResult.answer || (
                  <span className="italic opacity-80">
                    No answer text returned from knowledge base.
                  </span>
                )}
              </p>
            </div>

            {/* Divider */}
            <hr className="my-6 border-t border-[#72c1b3]" />

            {/* Source Section */}
            <div>
              <h3 className="text-xs font-bold tracking-wider text-white uppercase md:text-sm">
                SOURCE
              </h3>
              <div className="mt-2.5 flex flex-col gap-2">
                {currentResult.sources.length > 0 ? (
                  currentResult.sources.map((src, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 font-mono text-xs text-white md:text-sm"
                    >
                      <DocumentIcon />
                      <span>{src}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 font-mono text-xs text-white/80 md:text-sm">
                    <DocumentIcon />
                    <span>No document citation available</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────

function SendAirplaneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-white md:h-5 md:w-5"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white"
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
