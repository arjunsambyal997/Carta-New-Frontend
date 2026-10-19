# End-to-end tests

These tests drive the real app in a browser against a real backend and database. Each test creates its own organization through the sign-up API, so tests never share data and run in parallel.

## What they cover

| File                 | Flows                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `auth.spec.ts`       | Sign up through the form, sign out and in, wrong password, 404 page                                                         |
| `register.spec.ts`   | Setup, issuing certificates (confirm, cancel, limits, public QR check), cap table, search                                   |
| `transfers.spec.ts`  | Transfers and buy-backs, refusals, cap table as of a past date, holder ledger, certificate history, transfer instrument PDF |
| `options.spec.ts`    | Vesting schedule, exercise, over-exercise refused                                                                           |
| `governance.spec.ts` | Resolution lifecycle and minutes PDF, one vote per holder, shareholder portal and statement, two-person approval            |
| `tools.spec.ts`      | Funding round with SAFEs, scenarios, pool planner, CSV import, beneficial owners, audit chain, vault, succession            |
| `shell.spec.ts`      | Arabic and right-to-left, dark mode, phone menu, skip link, role-based menus, members, change password                      |
| `tour.spec.ts`       | Every page loads with data and no console errors                                                                            |
| `gallery.spec.ts`    | Every page at phone, tablet, laptop, desktop and ultrawide widths: no sideways scrolling, content fills wide screens        |

## Run them

1. Start PostgreSQL and the backend **with the authenticator switched off** (development only; the backend refuses to start in `prod` with this on):

   ```powershell
   $env:DB_URL="jdbc:postgresql://localhost:5544/equigcc_e2e"; $env:SERVER_PORT="8090"
   $env:DEV_SKIP_MFA="true"; $env:RATE_LIMIT_ENABLED="false"
   mvn spring-boot:run
   ```

2. From the frontend folder:

   ```bash
   npm ci
   npx playwright install chromium
   npm run test:e2e:live                 # builds the app, starts it on :3100, runs everything
   SHOTS=review npm run test:e2e:live -- gallery   # also saves full-page screenshots to e2e/.shots
   ```

Set `BACKEND_URL` / `API_URL` if the backend is not on `http://localhost:8090`, and `E2E_PORT` to change the frontend port. An HTML report is written to `playwright-report/`; failing tests keep a screenshot and, on retry, a trace.
