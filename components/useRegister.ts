"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/api";

export interface Loaded<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  connected: boolean;
  orgId: string | null;
}

/** Runs `load(orgId)` once the browser session (token + org) is available. */
export function useRegister<T>(load: (orgId: string) => Promise<T>): Loaded<T> {
  const [state, setState] = useState<Loaded<T>>({ data: null, error: null, loading: true, connected: true, orgId: null });

  useEffect(() => {
    const s = getSession();
    if (!s) {
      setState({ data: null, error: null, loading: false, connected: false, orgId: null });
      return;
    }
    let cancelled = false;
    load(s.orgId)
      .then((data) => !cancelled && setState({ data, error: null, loading: false, connected: true, orgId: s.orgId }))
      .catch((e: Error) => !cancelled && setState({ data: null, error: e.message, loading: false, connected: true, orgId: s.orgId }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
