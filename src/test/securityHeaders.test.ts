import { describe, expect, it } from "vitest";
import nextConfig, { securityHeaders } from "../../next.config.mjs";

const header = (key: string) => securityHeaders.find((h) => h.key === key)?.value ?? "";

describe("security headers", () => {
  it("apply to every page", async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toEqual([{ source: "/:path*", headers: securityHeaders }]);
  });

  it("forbid framing and limit where the page can connect and load from", () => {
    const csp = header("Content-Security-Policy");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toMatch(/connect-src 'self'(;| ws: wss:;)/);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(header("X-Frame-Options")).toBe("DENY");
    expect(header("Referrer-Policy")).toBe("no-referrer");
  });
});
