/**
 * The dashboard may only be embedded from another site over http(s). The iframe needs allow-scripts and
 * allow-same-origin for the dashboard's own sign-in, and that pair lets a page from the app's own origin lift its
 * sandbox, so a same-origin or non-http URL is refused.
 */
export function embeddableUrl(raw: string | undefined, appOrigin: string): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.origin === appOrigin) return null;
  return url.href;
}

/** Origin of the analytics site from NEXT_PUBLIC_ANALYTICS_URL (fixed at build time), or null when none is set. */
export const analyticsSiteOrigin = siteOrigin(process.env.NEXT_PUBLIC_ANALYTICS_URL);

export function siteOrigin(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}
