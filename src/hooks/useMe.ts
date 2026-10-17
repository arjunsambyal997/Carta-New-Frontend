"use client";

import { useEffect, useState } from "react";
import { api } from "@/api";
import { useSession } from "@/hooks/useSession";
import type { Me } from "@/api/types";

/** The signed-in account (role, linked shareholder): undefined while loading, null when signed out or the call failed. */
export function useMe(): Me | null | undefined {
  const session = useSession();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      setMe(null);
      return;
    }
    let cancelled = false;
    api
      .me()
      .then((m) => !cancelled && setMe(m))
      .catch(() => !cancelled && setMe(null));
    return () => {
      cancelled = true;
    };
  }, [session]);
  return me;
}
