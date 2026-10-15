"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/api";

/** Reactive view of the browser session; updates on sign in/out in this or another tab. */
export function useSession() {
  const [session, setSession] = useState<{ token: string; orgId: string } | null | undefined>(undefined);
  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener("equigcc-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("equigcc-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return session;
}
