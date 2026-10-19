# Sijill frontend (Carta-New-Frontend)

Next.js 15 (App Router) + TypeScript + Tailwind UI for the Sijill share register.
It talks to [Carta-New-Backend](https://github.com/arjunsambyal997/Carta-New-Backend).

**New here?** Read the step-by-step [user guide](docs/USER_GUIDE.md); a short version is on the in-app **Guide** page (`/guide`).

## Screens

| Route | What it does |
|---|---|
| `/` | Dashboard: first-run checklist, key figures, recent resolutions and certificates (shareholders are sent to `/portal`) |
| `/cap-table` | Cap table grid: issued / fully diluted ownership %, votes and voting %, per-class summary, CSV and PDF export |
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
| `/forgot-password`, `/reset-password`, `/password` | Request a reset link, set a new password from the emailed link, change your password while signed in |
| `/settings` | Developer fallback: paste a JWT and organization ID (stored in `localStorage`) |

The EN / العربية toggle switches `lang` and `dir` on `<html>`. Layout uses logical Tailwind classes
(`text-start`, `text-end`) so tables and the tree flip correctly. Numbers stay in Latin digits in both languages.

## Project structure

```
src/
  app/                   Next.js routes. Each page.tsx only re-exports a page from features/; layout.tsx wires providers
  features/              one folder per area, with its pages and components together
    audit/ auth/ cap-table/ certificates/ dashboard/ guide/ import/ members/ options/ ownership/
    portal/ resolutions/ rounds/ settings/ setup/ signatures/ succession/ transfers/ ubo/ vault/ waterfall/
  components/
    common/              app-wide building blocks: Icon, Avatar, PageHeader, Status, Feedback toasts, DownloadButton
    layout/              the shell, navigation and the Ctrl+K search palette
  api/                   client.ts (session, refresh-on-401, downloads) and one module per backend resource
  hooks/                 useMe, useRegister, useSession
  context/               I18nContext (locale, direction, translation and number helpers)
  i18n/                  en.json and ar.json, plus the typed key list
  designSystem/          globals.css: palette variables, dark mode, component classes
  test/                  shared test setup
e2e/                     Playwright tests; the backend is mocked
```

Conventions:

* New code goes into the feature it belongs to. Something used by two or more features moves to
  `components/common`, `hooks` or `api` rather than being imported across features.
* Import across folders with the `@/` alias (`@/components/common/Icon`); use `./` only within the same folder.
* Every user-visible string goes through `t()` with a key in **both** `i18n/en.json` and `i18n/ar.json`;
  a unit test fails if the two files drift apart.
* Folders are kebab-case, components PascalCase.
* `api/index.ts` exposes one `api` object and each resource's own module (`capTableApi`, `governanceApi`, ...).

## Run

For the full stack (database, backend and UI in Docker, or step by step) and a walk through every screen, see the [backend README](https://github.com/arjunsambyal997/Carta-New-Backend#run-locally-full-flow). Frontend only:

```bash
npm install
BACKEND_URL=http://localhost:8080 npm run dev      # /api/v1/* is proxied to the backend, so no CORS setup
npm run dev-token -- <organizationId>             # mint a dev JWT (FOUNDER + TOTP) for the backend's default dev secret
npm run dev-token -- <orgId> SHAREHOLDER --shareholder=<shareholderId>   # a token that votes as that shareholder
npm run typecheck && npm run build
```

| Script | Purpose |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `npm run test:coverage` | Unit tests (Vitest) with a coverage floor |
| `npm run test:e2e` | Browser tests (Playwright); set `PW_CHROMIUM_PATH` to use an installed Chromium |
| `npm run lint` / `npm run format:check` | Oxlint / Prettier |

A pre-commit hook (husky + lint-staged) formats and lints staged files. CI runs the same checks, the production build and a Docker build.

Sign up at `/signup`, scan the QR with an authenticator app, and confirm a code. For scripted work, `npm run dev-token` still mints a token you can paste at `/settings`.

## Not built yet

Tokens live in `localStorage` (short-lived access token, rotating refresh token); qualified e-signature and the official UBO filing formats.
