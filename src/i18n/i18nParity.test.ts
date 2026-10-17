import { describe, expect, it } from "vitest";
import ar from "./ar.json";
import en from "./en.json";

describe("translations", () => {
  const enKeys = Object.keys(en).sort();
  const arKeys = Object.keys(ar).sort();

  it("have the same keys in English and Arabic", () => {
    expect(arKeys.filter((k) => !(k in en))).toEqual([]);
    expect(enKeys.filter((k) => !(k in ar))).toEqual([]);
  });

  it("have no empty strings", () => {
    const empty = [...Object.entries(en), ...Object.entries(ar)].filter(([, v]) => !String(v).trim()).map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it("keep the same {placeholders} in both languages", () => {
    const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    const mismatched = enKeys.filter(
      (k) => holes((en as Record<string, string>)[k]) !== holes((ar as Record<string, string>)[k]),
    );
    expect(mismatched).toEqual([]);
  });
});
