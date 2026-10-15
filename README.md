# Carta-New Frontend (EquiGCC)

Next.js 15 (App Router) + TypeScript + Tailwind UI for the EquiGCC share register.
It talks to [Carta-New-Backend](https://github.com/arjunsambyal997/Carta-New-Backend).

## Screens

| Route | What it does |
|---|---|
| `/` | Cap table grid: issued / fully diluted ownership %, votes and voting %, per-class summary |
| `/ownership` | SVG ownership tree, node width = fully diluted %; mirrors in RTL |
| `/waterfall` | Exit waterfall: enter an exit value, see payouts per share class and shareholder (preferences, conversion) |
| `/certificates/new` | Issue a certificate (par value, authorized-share and currency errors come back from the API); shows a verification QR |
| `/verify/[certNo]?h=<hash>` | Public page the QR opens; checks the SHA-256 hash against the register |
| `/settings` | Paste a JWT and organization ID (stored in `localStorage`) |

The EN / العربية toggle switches `lang` and `dir` on `<html>`. Layout uses logical Tailwind classes
(`text-start`, `text-end`) so tables and the tree flip correctly. Numbers stay in Latin digits in both languages.

## Run

```bash
npm install
BACKEND_URL=http://localhost:8080 npm run dev      # /api/v1/* is proxied to the backend, so no CORS setup
npm run dev-token -- <organizationId>             # mint a dev JWT (FOUNDER + TOTP) for the backend's default dev secret
npm run typecheck && npm run build
```

Open `/settings`, paste the organization ID and token, then use the other screens.

## Not built yet

Real login and TOTP enrollment (the JWT is pasted for now), shareholder-to-shareholder links for the
holding-company / UBO hierarchy (the tree is company → holders), board portal,
and PDF certificates.
