"use client";

import { useCallback, useRef, useState } from "react";

type HistoryOptions = {
  limit?: number;
};

type PushOptions = {
  record?: boolean;
};

export function useHistory<T>(initialState: T, options: HistoryOptions = {}) {
  const limit = options.limit ?? 80;
  const [state, setState] = useState<T>(initialState);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const stateRef = useRef<T>(initialState);

  const commit = useCallback(
    (next: T, record = true) => {
      setState((current) => {
        if (Object.is(current, next)) return current;

        if (record) {
          pastRef.current = [...pastRef.current.slice(-(limit - 1)), current];
          futureRef.current = [];
        }

        stateRef.current = next;
        return next;
      });
    },
    [limit]
  );

  const push = useCallback(
    (next: T | ((current: T) => T), pushOptions: PushOptions = {}) => {
      const resolved = typeof next === "function" ? (next as (current: T) => T)(stateRef.current) : next;
      commit(resolved, pushOptions.record !== false);
    },
    [commit]
  );

  const replace = useCallback(
    (next: T | ((current: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (current: T) => T)(stateRef.current) : next;
      commit(resolved, false);
    },
    [commit]
  );

  const reset = useCallback((next: T) => {
    pastRef.current = [];
    futureRef.current = [];
    stateRef.current = next;
    setState(next);
  }, []);

  const undo = useCallback(() => {
    const previous = pastRef.current.at(-1);
    if (previous === undefined) return;

    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [stateRef.current, ...futureRef.current];
    stateRef.current = previous;
    setState(previous);
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current[0];
    if (next === undefined) return;

    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, stateRef.current].slice(-limit);
    stateRef.current = next;
    setState(next);
  }, [limit]);

  return {
    state,
    push,
    replace,
    reset,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
