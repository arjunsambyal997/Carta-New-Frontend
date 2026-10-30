import { describe, expect, it } from "vitest";
import { embeddableUrl } from "@/features/analytics/embed";
import { analyticsOrigin } from "../../../next.config.mjs";

const APP = "https://app.sijill.example";

describe("embeddableUrl", () => {
  it("accepts a dashboard on another site", () => {
    expect(embeddableUrl("https://bi.example.com/d/1?theme=night", APP)).toBe("https://bi.example.com/d/1?theme=night");
  });
  it("refuses nothing, a relative path, a non-http scheme and the app's own origin", () => {
    expect(embeddableUrl(undefined, APP)).toBeNull();
    expect(embeddableUrl("", APP)).toBeNull();
    expect(embeddableUrl("/analytics", APP)).toBeNull();
    expect(embeddableUrl("javascript:alert(1)", APP)).toBeNull();
    expect(embeddableUrl(`${APP}/dash`, APP)).toBeNull();
  });
});

describe("analyticsOrigin", () => {
  it("gives the origin the CSP may frame, or nothing", () => {
    expect(analyticsOrigin("https://bi.example.com/d/1")).toBe("https://bi.example.com");
    expect(analyticsOrigin("javascript:alert(1)")).toBeNull();
    expect(analyticsOrigin("not a url")).toBeNull();
    expect(analyticsOrigin("")).toBeNull();
  });
});
