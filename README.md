# Carta-New Frontend (EquiGCC)

Next.js 15 (App Router) + TypeScript + Tailwind UI for the EquiGCC share register.
It talks to [Carta-New-Backend](https://github.com/arjunsambyal997/Carta-New-Backend).

## Screens

| Route | What it does |
|---|---|
| `/` | Cap table grid: issued / fully diluted ownership %, votes and voting %, per-class summary |
| `/ownership` | SVG ownership tree, node width = fully diluted %; mirrors in RTL |
| `/waterfall` | Exit waterfall: enter an exit value, see payouts per share class and shareholder (preferences, conversion) |
| `/resolutions`, `/resolutions/[id]` | Board resolutions: create a draft, open voting, cast For / Against / Abstain, live tally with quorum marker, close and decide |
| `/audit` | Append-only audit trail with a hash-chain integrity check |
| `/certificates/new` | Issue a certificate (par value, authorized-share and currency errors come back from the API); shows a verification QR |
| `/verify/[certNo]?h=<hash>` | Public page the QR opens; checks the SHA-256 hash against the register |
| `/login`, `/signup`, `/security` | Password sign-in with an authenticator-app code, organization sign-up, TOTP enrollment with QR; data stays locked until 2FA is on |
| `/setup`, `/members` | Add share classes and shareholders; invite team members (temporary password shown once) |
| `/certificates` | Certificate list with authenticated PDF download (English and Arabic, verification QR) |
| `/ubo` | Look-through beneficial owners, owners editor for corporate holders, CSV and PDF export; `/ownership` also shows each company's recorded owners |
| `/succession` | Define, preview, execute and cancel share-class conversion rules |
| `/vault` | Upload and download AoA, notary receipts and agreements; shows each file's SHA-256 |
| `/settings` | Developer fallback: paste a JWT and organization ID (stored in `localStorage`) |

The EN / العربية toggle switches `lang` and `dir` on `<html>`. Layout uses logical Tailwind classes
(`text-start`, `text-end`) so tables and the tree flip correctly. Numbers stay in Latin digits in both languages.

## Run

```bash
npm install
BACKEND_URL=http://localhost:8080 npm run dev      # /api/v1/* is proxied to the backend, so no CORS setup
npm run dev-token -- <organizationId>             # mint a dev JWT (FOUNDER + TOTP) for the backend's default dev secret
npm run dev-token -- <orgId> SHAREHOLDER --shareholder=<shareholderId>   # a token that votes as that shareholder
npm run typecheck && npm run build
```

Sign up at `/signup`, scan the QR with an authenticator app, and confirm a code. For scripted work, `npm run dev-token` still mints a token you can paste at `/settings`.

## Not built yet

Token refresh and server-side sign-out (access tokens last one hour and live in `localStorage`), password reset by email, e-signature, and the official UBO filing formats.
