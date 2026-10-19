import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, saveSession } from "./index";

const O = "/api/v1/organizations/o1";
const file = new File(["x"], "x.csv");

/** [name, call, expected method, expected path (prefix match)] — a contract check against the backend's routes. */
const cases: [string, () => Promise<unknown>, string, string][] = [
  ["organization", () => api.organization("o1"), "GET", O],
  ["shareClasses", () => api.shareClasses("o1"), "GET", `${O}/share-classes`],
  ["shareholders", () => api.shareholders("o1"), "GET", `${O}/shareholders`],
  ["createShareClass", () => api.createShareClass("o1", {} as never), "POST", `${O}/share-classes`],
  ["createShareholder", () => api.createShareholder("o1", {} as never), "POST", `${O}/shareholders`],
  ["members", () => api.members("o1"), "GET", `${O}/members`],
  [
    "invite",
    () => api.invite("o1", { email: "a@b.c", displayName: "A", role: "BOARD_MEMBER" }),
    "POST",
    `${O}/members`,
  ],
  ["capTable", () => api.capTable("o1"), "GET", `${O}/cap-table`],
  ["waterfall", () => api.waterfall("o1", 5000), "GET", `${O}/waterfall?exitValue=5000`],
  ["search", () => api.search("o1", "a b"), "GET", `${O}/search?q=a%20b`],
  ["certificates", () => api.certificates("o1"), "GET", `${O}/certificates`],
  ["issueCertificate", () => api.issueCertificate("o1", {} as never), "POST", `${O}/certificates`],
  ["resolutions", () => api.resolutions("o1"), "GET", `${O}/resolutions`],
  ["resolution", () => api.resolution("o1", "r1"), "GET", `${O}/resolutions/r1`],
  ["createResolution", () => api.createResolution("o1", {} as never), "POST", `${O}/resolutions`],
  ["openResolution", () => api.openResolution("o1", "r1"), "POST", `${O}/resolutions/r1/open`],
  ["closeResolution", () => api.closeResolution("o1", "r1"), "POST", `${O}/resolutions/r1/close`],
  ["remindResolution", () => api.remindResolution("o1", "r1"), "POST", `${O}/resolutions/r1/remind`],
  ["castVote", () => api.castVote("o1", "r1", "FOR"), "POST", `${O}/resolutions/r1/votes`],
  ["ownershipLinks", () => api.ownershipLinks("o1"), "GET", `${O}/ownership-links`],
  ["setOwners", () => api.setOwners("o1", "h1", []), "PUT", `${O}/shareholders/h1/owners`],
  ["ubo", () => api.ubo("o1", 25), "GET", `${O}/ubo?threshold=25`],
  ["successionRules", () => api.successionRules("o1"), "GET", `${O}/succession-rules`],
  ["createSuccessionRule", () => api.createSuccessionRule("o1", {} as never), "POST", `${O}/succession-rules`],
  ["previewSuccession", () => api.previewSuccession("o1", "s1"), "GET", `${O}/succession-rules/s1/preview`],
  ["executeSuccession", () => api.executeSuccession("o1", "s1"), "POST", `${O}/succession-rules/s1/execute`],
  ["cancelSuccession", () => api.cancelSuccession("o1", "s1"), "POST", `${O}/succession-rules/s1/cancel`],
  ["apiKeys", () => api.apiKeys("o1"), "GET", `${O}/api-keys`],
  ["createApiKey", () => api.createApiKey("o1", "BI"), "POST", `${O}/api-keys`],
  ["revokeApiKey", () => api.revokeApiKey("o1", "k1"), "DELETE", `${O}/api-keys/k1`],
  ["webhookEvents", () => api.webhookEvents("o1"), "GET", `${O}/webhook-events`],
  ["webhooks", () => api.webhooks("o1"), "GET", `${O}/webhooks`],
  ["createWebhook", () => api.createWebhook("o1", { url: "https://x.y", events: [] }), "POST", `${O}/webhooks`],
  ["updateWebhook", () => api.updateWebhook("o1", "w1", { active: false }), "PATCH", `${O}/webhooks/w1`],
  ["deleteWebhook", () => api.deleteWebhook("o1", "w1"), "DELETE", `${O}/webhooks/w1`],
  ["testWebhook", () => api.testWebhook("o1", "w1"), "POST", `${O}/webhooks/w1/test`],
  ["webhookDeliveries", () => api.webhookDeliveries("o1", "w1"), "GET", `${O}/webhooks/w1/deliveries`],
  ["retryDelivery", () => api.retryDelivery("o1", "d1"), "POST", `${O}/webhook-deliveries/d1/retry`],
  ["vault", () => api.vault("o1"), "GET", `${O}/vault`],
  ["vaultUpload", () => api.vaultUpload("o1", "AoA", "ARTICLES" as never, file), "POST", `${O}/vault`],
  ["audit", () => api.audit("o1"), "GET", `${O}/audit`],
  ["importCsv", () => api.importCsv("o1", "shareholders", file, true), "POST", `${O}/import/shareholders?dryRun=true`],
  ["transfer", () => api.transfer("o1", {} as never), "POST", `${O}/transfers`],
  ["buyBack", () => api.buyBack("o1", {} as never), "POST", `${O}/buybacks`],
  ["simulateRound", () => api.simulateRound("o1", {} as never), "POST", `${O}/rounds/simulate`],
  ["vesting", () => api.vesting("o1"), "GET", `${O}/vesting`],
  [
    "setVesting",
    () => api.setVesting("o1", "C-1", { startDate: "2026-01-01", cliffMonths: 12, vestingMonths: 48 }),
    "PUT",
    `${O}/certificates/C-1/vesting`,
  ],
  [
    "exerciseOptions",
    () => api.exerciseOptions("o1", "C-1", { quantity: 1 }),
    "POST",
    `${O}/certificates/C-1/exercise`,
  ],
  ["portalSummary", () => api.portalSummary(), "GET", "/api/v1/portal/summary"],
  [
    "signatures",
    () => api.signatures("o1", "RESOLUTION" as never, "r1"),
    "GET",
    `${O}/signatures?documentType=RESOLUTION&documentRef=r1`,
  ],
  [
    "sign",
    () => api.sign("o1", { documentType: "RESOLUTION" as never, documentRef: "r1", code: "123456" }),
    "POST",
    `${O}/signatures`,
  ],
  ["me", () => api.me(), "GET", "/api/v1/auth/me"],
  ["mfaEnroll", () => api.mfaEnroll(), "POST", "/api/v1/auth/mfa/enroll"],
  ["mfaConfirm", () => api.mfaConfirm("123456"), "POST", "/api/v1/auth/mfa/confirm"],
  ["login", () => api.login("a@b.c", "pw"), "POST", "/api/v1/auth/login"],
  ["signup", () => api.signup({} as never), "POST", "/api/v1/auth/signup"],
  ["verifyMfa", () => api.verifyMfa("t", "123456"), "POST", "/api/v1/auth/mfa/verify"],
  ["forgotPassword", () => api.forgotPassword("a@b.c"), "POST", "/api/v1/auth/password/forgot"],
  ["resetPassword", () => api.resetPassword("t", "long enough password"), "POST", "/api/v1/auth/password/reset"],
  ["changePassword", () => api.changePassword("a", "b"), "POST", "/api/v1/auth/password/change"],
  ["verifyCertificate", () => api.verifyCertificate("C 1", "abc"), "GET", "/api/v1/certificates/C%201/verify?h=abc"],
];

beforeEach(() => {
  saveSession("tok", "o1");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("API endpoints", () => {
  it.each(cases)("%s", async (_name, call, method, path) => {
    await call();
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toBe(path);
    expect((init?.method ?? "GET").toUpperCase()).toBe(method);
  });

  it("sends public auth calls without a bearer token", async () => {
    await api.login("a@b.c", "pw");
    const headers = new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers);
    expect(headers.has("Authorization")).toBe(false);
  });
});
