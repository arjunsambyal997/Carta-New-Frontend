"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FRESH_MS, getSession } from "@/api";

export interface Loaded<T> {
  data: T | null;
  error: string | null;
  /** True until the first answer arrives. Later reloads keep the old data on screen and set `refreshing` instead. */
  loading: boolean;
  connected: boolean;
  orgId: string | null;
  /** True while a reload runs on top of data that is already shown. */
  refreshing?: boolean;
  /** Runs the loader again, e.g. from a Retry button after an error. */
  reload?: () => void;
}

/** Runs `load(orgId)` once the browser session (token + org) is available, and again when `refreshKey` changes. */
export function useRegister<T>(load: (orgId: string) => Promise<T>, refreshKey = 0): Loaded<T> {
  const [state, setState] = useState<Loaded<T>>({
    data: null,
    error: null,
    loading: true,
    connected: true,
    orgId: null,
    refreshing: false,
  });
  const [attempt, setAttempt] = useState(0);
  const loadedAt = useRef(0);
  // Callers pass an inline arrow; keep the newest one without re-running the load on every render.
  // Declared before the load effect so it has already run when that effect reads it.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    const s = getSession();
    if (!s) {
      setState({ data: null, error: null, loading: false, connected: false, orgId: null, refreshing: false });
      return;
    }
    let cancelled = false;
    // Keep what is on screen while reloading; show the skeleton again only when there is nothing to show.
    setState((prev) => {
      if (prev.data !== null) return { ...prev, refreshing: true };
      return prev.loading && !prev.error ? prev : { ...prev, loading: true, error: null };
    });
    loadRef
      .current(s.orgId)
      .then((data) => {
        if (cancelled) return;
        loadedAt.current = Date.now();
        setState({ data, error: null, loading: false, connected: true, orgId: s.orgId, refreshing: false });
      })
      .catch(
        (e: Error) =>
          !cancelled &&
          setState({
            data: null,
            error: e.message,
            loading: false,
            connected: true,
            orgId: s.orgId,
            refreshing: false,
          }),
      );
    return () => {
      cancelled = true;
    };
  }, [refreshKey, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  // Coming back to the tab after a while shows what changed meanwhile (another person's vote, a new holder).
  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState !== "visible" || loadedAt.current === 0) return;
      if (Date.now() - loadedAt.current < FRESH_MS) return;
      loadedAt.current = Date.now(); // focus and visibilitychange often fire together; reload once
      reload();
    };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [reload]);
  return useMemo(() => ({ ...state, reload }), [state, reload]);
}
