import ar from "./ar.json";
import en from "./en.json";

export type Locale = "en" | "ar";
export type Key = keyof typeof en;

// Compile-time guarantee that Arabic has every key English has (and nothing extra).
export const dictionaries: Record<Locale, Record<Key, string>> = { en, ar };
