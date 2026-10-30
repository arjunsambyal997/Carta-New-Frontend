import { describe, expect, it } from "vitest";
import { canOpen } from "./nav";

describe("canOpen", () => {
  it("keeps shareholder-portal logins to their own pages", () => {
    expect(canOpen("/", "SHAREHOLDER")).toBe(true);
    expect(canOpen("/portal", "SHAREHOLDER")).toBe(true);
    expect(canOpen("/resolutions", "SHAREHOLDER")).toBe(true);
    expect(canOpen("/cap-table", "SHAREHOLDER")).toBe(false);
    expect(canOpen("/approvals", "SHAREHOLDER")).toBe(false);
  });

  it("follows each page's roles for staff", () => {
    expect(canOpen("/audit", "BOARD_MEMBER")).toBe(false);
    expect(canOpen("/audit", "LEGAL_AUDITOR")).toBe(true);
    expect(canOpen("/members", "CORPORATE_SECRETARY")).toBe(false);
    expect(canOpen("/members", "FOUNDER")).toBe(true);
    expect(canOpen("/cap-table", "BOARD_MEMBER")).toBe(true);
  });

  it("leaves pages outside the nav to the server", () => {
    expect(canOpen("/settings", "BOARD_MEMBER")).toBe(true);
    expect(canOpen("/companies/new", "FOUNDER")).toBe(true);
  });
});
