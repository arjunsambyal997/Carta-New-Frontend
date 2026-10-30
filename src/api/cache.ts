/**
 * A small in-memory cache for authenticated GETs, shared by every page in this tab.
 *
 * - Two pages (or the shell and a page) asking for the same thing at once share one request.
 * - An answer stays fresh for FRESH_MS, so moving between pages does not refetch everything.
 * - Any change (POST, PUT, PATCH, DELETE) and any sign in, sign out or company switch empties it, so a page never
 *   shows data from before a change it just made, or from another account.
 * - Callers get a copy, so a page that sorts or edits its data cannot change what the next page sees.
 */

export const FRESH_MS = 30_000;
const MAX_ENTRIES = 200;

const fresh = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
// Bumped on every clear: an answer that started before a change must not be stored after it.
let generation = 0;

const copy = <T>(v: T): T => (v === undefined ? v : structuredClone(v));

export function cachedGet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = fresh.get(key);
  if (hit && Date.now() - hit.at < FRESH_MS) return Promise.resolve(copy(hit.data as T));

  let pending = inflight.get(key) as Promise<T> | undefined;
  if (!pending) {
    const started = generation;
    pending = fetcher()
      .then((data) => {
        if (started === generation) {
          fresh.delete(key);
          fresh.set(key, { at: Date.now(), data });
          if (fresh.size > MAX_ENTRIES) fresh.delete(fresh.keys().next().value as string);
        }
        return data;
      })
      .finally(() => {
        if (inflight.get(key) === pending) inflight.delete(key);
      });
    inflight.set(key, pending);
  }
  return pending.then(copy);
}

/** Sent on window after every clear, so counters outside the current page (nav badges) can re-check. */
export const DATA_CHANGED = "equigcc-data-changed";

/** Forgets everything; the next read of any path goes to the server. */
export function clearRequestCache() {
  generation++;
  fresh.clear();
  inflight.clear();
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DATA_CHANGED));
}

if (typeof window !== "undefined") window.addEventListener("equigcc-session", clearRequestCache);
