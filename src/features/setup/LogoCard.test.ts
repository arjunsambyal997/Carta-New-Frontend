import { describe, expect, it } from "vitest";
import { logoProblem } from "./LogoCard";

describe("logoProblem", () => {
  it("accepts PNG, JPEG and WEBP up to 512 KB", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      expect(logoProblem({ type, size: 512 * 1024 })).toBeNull();
    }
  });
  it("rejects SVG and other types", () => {
    expect(logoProblem({ type: "image/svg+xml", size: 100 })).toBe("logoBadType");
    expect(logoProblem({ type: "application/pdf", size: 100 })).toBe("logoBadType");
  });
  it("rejects files over 512 KB", () => {
    expect(logoProblem({ type: "image/png", size: 512 * 1024 + 1 })).toBe("logoTooBig");
  });
});
