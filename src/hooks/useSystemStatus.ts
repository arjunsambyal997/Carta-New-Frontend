"use client";

import { useEffect, useState } from "react";
import { api } from "@/api";
import type { SystemStatus } from "@/api/types";

const POLL_MS = 60_000;

/** Polls the public status endpoint. Failures are ignored: a banner must never get in the way of the page. */
export function useSystemStatus(): SystemStatus | null {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .systemStatus()
        .then((s) => alive && setStatus(s))
        .catch(() => undefined);
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);
  return status;
}
