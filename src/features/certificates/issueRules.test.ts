import { describe, expect, it } from "vitest";
import { fill, validateIssue } from "./issueRules";

const f = { holderId: "h", classId: "c", instrument: "SHARES" as const, quantity: "100", price: "1" };

describe("validateIssue", () => {
  it("accepts a normal issue", () => expect(validateIssue(f, { parValue: 1, left: 1000 })).toEqual({}));
  it("needs a holder, a class and a whole quantity", () => {
    expect(validateIssue({ ...f, holderId: "", classId: "", quantity: "1.5" }, null)).toEqual({
      holderId: "errRequired",
      classId: "errRequired",
      quantity: "errWholeNumber",
    });
  });
  it("stops at the authorised limit", () => {
    expect(validateIssue({ ...f, quantity: "1001" }, { parValue: 1, left: 1000 }).quantity).toBe("errOverAuthorized");
    expect(validateIssue({ ...f, quantity: "1000000" }, { parValue: 1, left: null })).toEqual({});
  });
  it("refuses shares below par but allows options at any price", () => {
    expect(validateIssue({ ...f, price: "0.5" }, { parValue: 1, left: null }).price).toBe("errBelowPar");
    expect(validateIssue({ ...f, instrument: "OPTION", price: "0" }, { parValue: 1, left: null })).toEqual({});
    expect(validateIssue({ ...f, price: "" }, null).price).toBe("errNotNegative");
  });
});

describe("fill", () => {
  it("replaces known placeholders and leaves the rest", () =>
    expect(fill("{n} of {total} {x}", { n: "5", total: "10" })).toBe("5 of 10 {x}"));
});
