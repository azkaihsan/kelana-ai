"use client";

import { useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastVariant = "error" | "success" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Minimal toast manager.
 *
 * Usage:
 *   const { toasts, showToast, dismissToast } = useToast();
 *   // render <ToastContainer toasts={toasts} onDismiss={dismissToast} />
 *   // trigger with: showToast("Something went wrong.", "error")
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info", durationMs = 4000) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
