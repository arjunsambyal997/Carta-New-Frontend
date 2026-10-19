import { describe, expect, it } from "vitest";
import { validateClass, validateHolder } from "./validate";

const cls = {
  name: "Ordinary",
  parValue: "1",
  votingMultiplier: "1",
  liquidationMultiple: "0",
  seniorityRank: "1",
  authorizedShares: "",
};
const holder = {
  holderType: "INDIVIDUAL" as const,
  fullNameEn: "Fatima",
  nationality: "AE",
  dateOfBirth: "1980-01-01",
  email: "f@x.ae",
};

describe("validateClass", () => {
  it("accepts a normal class", () => expect(validateClass(cls)).toEqual({}));
  it("needs a name and a positive par value", () => {
    expect(validateClass({ ...cls, name: "  ", parValue: "0" })).toEqual({
      name: "errRequired",
      parValue: "errPositive",
    });
    expect(validateClass({ ...cls, parValue: "" }).parValue).toBe("errPositive");
  });
  it("rejects negative multipliers and fractional ranks or authorised shares", () => {
    const e = validateClass({
      ...cls,
      votingMultiplier: "-1",
      liquidationMultiple: "-2",
      seniorityRank: "1.5",
      authorizedShares: "0",
    });
    expect(e).toEqual({
      votingMultiplier: "errNotNegative",
      liquidationMultiple: "errNotNegative",
      seniorityRank: "errWholeNumber",
      authorizedShares: "errWholeNumber",
    });
  });
});

describe("validateHolder", () => {
  const today = new Date("2026-10-19");
  it("accepts a normal holder and an empty optional set", () => {
    expect(validateHolder(holder, today)).toEqual({});
    expect(validateHolder({ ...holder, nationality: "", dateOfBirth: "", email: "" }, today)).toEqual({});
  });
  it("flags a missing name, a bad country code, a future birth date and a malformed email", () => {
    expect(
      validateHolder(
        { ...holder, fullNameEn: "", nationality: "UAE", dateOfBirth: "2030-01-01", email: "nope" },
        today,
      ),
    ).toEqual({
      fullNameEn: "errRequired",
      nationality: "errCountryCode",
      dateOfBirth: "errPastDate",
      email: "errEmail",
    });
  });
  it("ignores date of birth for corporate holders", () => {
    expect(validateHolder({ ...holder, holderType: "CORPORATE", dateOfBirth: "2030-01-01" }, today)).toEqual({});
  });
});
