"use client";

import { useEffect } from "react";

const DISABLED_CONSOLE_METHODS = [
  "assert",
  "clear",
  "count",
  "countReset",
  "debug",
  "dir",
  "dirxml",
  "error",
  "group",
  "groupCollapsed",
  "groupEnd",
  "info",
  "log",
  "profile",
  "profileEnd",
  "table",
  "time",
  "timeEnd",
  "timeLog",
  "timeStamp",
  "trace",
  "warn",
] as const;

type ConsoleMethod = (typeof DISABLED_CONSOLE_METHODS)[number];

/**
 * Silences editor console output without freezing or locking the native console.
 *
 * Important:
 * - Do not call Object.freeze(console).
 * - Do not define methods as non-writable/non-configurable.
 *
 * Next.js/React dev runtime patches console.error/warn during navigation and
 * scroll restoration. Locking those properties causes:
 * "Cannot assign to read only property 'error' of object '#<Object>'".
 */
export default function ConsoleGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalConsoleMethods = new Map<ConsoleMethod, unknown>();
    const noop = () => undefined;

    for (const method of DISABLED_CONSOLE_METHODS) {
      try {
        originalConsoleMethods.set(method, window.console[method]);

        Object.defineProperty(window.console, method, {
          configurable: true,
          enumerable: true,
          value: noop,
          writable: true,
        });
      } catch {
        // Best-effort only. Never lock/freeze console methods.
      }
    }

    try {
      delete (window as any).__EDITOR_DEBUG__;
      delete (window as any).__EDITOR_PREVIEW_DEBUG__;
      delete (window as any).__EDITOR_SAVE_DEBUG__;
    } catch {
      // Ignore browser/runtime restrictions.
    }

    return () => {
      for (const [method, original] of originalConsoleMethods.entries()) {
        try {
          Object.defineProperty(window.console, method, {
            configurable: true,
            enumerable: true,
            value: original,
            writable: true,
          });
        } catch {
          // Ignore browser/runtime restrictions.
        }
      }
    };
  }, []);

  return null;
}
