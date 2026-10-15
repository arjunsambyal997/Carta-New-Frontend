// Mint a dev JWT for the backend:
//   node scripts/dev-token.mjs <orgId> [ROLE] [--no-mfa] [--shareholder=<shareholderId>]
// Uses the backend's default dev secret; override with JWT_SECRET.
import { createHmac } from "node:crypto";

const [orgId, role = "FOUNDER"] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!orgId) {
  console.error("usage: node scripts/dev-token.mjs <orgId> [ROLE] [--no-mfa] [--shareholder=<id>]");
  process.exit(1);
}
const secret = process.env.JWT_SECRET ?? "change-me-change-me-change-me-change-me-0123456789";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const head = b64({ alg: "HS256" });
const shareholder = process.argv.find((a) => a.startsWith("--shareholder="))?.split("=")[1];
const body = b64({
  sub: "dev@equigcc.local",
  roles: [role],
  org_ids: [orgId],
  ...(shareholder ? { shareholder_id: shareholder } : {}),
  amr: process.argv.includes("--no-mfa") ? ["pwd"] : ["pwd", "otp"],
  iat: now,
  exp: now + 8 * 3600,
});
const sig = createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
console.log(`${head}.${body}.${sig}`);
