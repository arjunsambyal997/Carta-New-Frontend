import { describe, expect, it } from "vitest";
import type { Certificate } from "@/api/types";
import { heldShares, validateMove } from "./transferRules";

const cert = (o: Partial<Certificate>) =>
  ({
    status: "ISSUED",
    instrumentType: "SHARES",
    shareholderId: "a",
    shareClassId: "c",
    quantity: 10,
    ...o,
  }) as Certificate;

describe("heldShares", () => {
  it("counts only the holder's live share certificates in the class", () => {
    const certs = [
      cert({}),
      cert({ quantity: 5 }),
      cert({ status: "TRANSFERRED", quantity: 100 }),
      cert({ instrumentType: "OPTION", quantity: 100 }),
      cert({ shareholderId: "b", quantity: 100 }),
      cert({ shareClassId: "d", quantity: 100 }),
    ];
    expect(heldShares(certs, "a", "c")).toBe(15);
  });
});

describe("validateMove", () => {
  const f = { mode: "transfer" as const, from: "a", to: "b", cls: "c", qty: "10", price: "" };
  it("accepts a transfer without a price", () => expect(validateMove(f, 10)).toEqual({}));
  it("stops at what the seller holds", () => expect(validateMove({ ...f, qty: "11" }, 10).qty).toBe("errOverHeld"));
  it("needs a buyer for a transfer but not for a buy-back", () => {
    expect(validateMove({ ...f, to: "" }, null).to).toBe("errRequired");
    expect(validateMove({ ...f, mode: "buyback", to: "", price: "2" }, null)).toEqual({});
  });
  it("needs a price for a buy-back and never a negative one", () => {
    expect(validateMove({ ...f, mode: "buyback" }, null).price).toBe("errNotNegative");
    expect(validateMove({ ...f, price: "-1" }, null).price).toBe("errNotNegative");
  });
});
