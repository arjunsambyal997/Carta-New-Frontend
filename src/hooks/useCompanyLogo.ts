"use client";

import { useEffect, useState } from "react";
import { api } from "@/api";

/** Fired after the logo is uploaded or removed so the shell can reload the company. */
export const LOGO_CHANGED = "sijill-logo-changed";

const cache = new Map<string, string>();

/**
 * Object URL for the company logo, or null while loading / when there is none. The logo needs the bearer token,
 * so it cannot be an <img src>; it is fetched once per (company, upload time) and kept for the page's life.
 */
export function useCompanyLogo(orgId: string | undefined, version: string | null | undefined): string | null {
  const key = orgId && version ? `${orgId}:${version}` : null;
  const [url, setUrl] = useState<string | null>(key ? (cache.get(key) ?? null) : null);
  useEffect(() => {
    if (!orgId || !key) {
      setUrl(null);
      return;
    }
    const hit = cache.get(key);
    if (hit) {
      setUrl(hit);
      return;
    }
    let cancelled = false;
    api
      .logoBlob(orgId)
      .then((b) => {
        if (!b || cancelled) return;
        const u = URL.createObjectURL(b);
        cache.set(key, u);
        setUrl(u);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [orgId, key]);
  return url;
}
