# EquiGCC user guide

EquiGCC is a share register for GCC companies. It keeps your cap table, issues numbered share certificates, runs board votes, traces beneficial owners and keeps an audit trail that cannot be edited.

This guide follows the order you'll use it in: start the app, sign in, then do each job step by step. The app has a short version under **Guide** in the sidebar.

---

## 1. Start the app

You need both the backend (API and database) and this frontend running.

**Easiest: Docker.** From the `Carta-New-Backend` folder:

```bash
docker compose up --build
```

Open http://localhost:3000. The backend runs on port 8081.

**Without Docker.** Start PostgreSQL and the backend first (see the backend README), then from this folder:

```powershell
npm install
$env:BACKEND_URL="http://localhost:8080"; npm run dev
```

Use the port your backend is actually listening on. If pages show "Something went wrong" or keep loading, the backend isn't reachable.

---

## 2. Create your organization and sign in

1. Go to **/signup** and create your organization: company name in English and Arabic, jurisdiction, licence number, base currency and a certificate prefix. The prefix numbers your certificates, so `ACME` gives `ACME-000001`. You become the **Founder**.
2. On the **Security** page, scan the QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password and so on) and type in the 6-digit code. **Your data stays locked until two-factor is on.**
3. From now on you sign in at **/login** with your email, password and a fresh authenticator code.

If you forget your password, use **Forgot your password?** on the sign-in page. Without a mail server, the reset link is written to the backend log on a line starting `MAIL NOT CONFIGURED`.

### Fill it with demo data (optional)

To explore with realistic data, run this from the backend folder once your organization exists and two-factor is on:

```powershell
$env:API_URL="http://localhost:8081"; node scripts/seed-demo.mjs
```

It asks for your email, password and a current authenticator code. It adds five share classes, 14 shareholders, certificates, holding companies, board resolutions, succession rules and vault documents.

---

## 3. Who can do what

| Role | What they see and do |
|---|---|
| **Founder** | Everything, including inviting members |
| **Corporate secretary** | Runs the register: setup, import, issuing, transfers, options, resolutions, UBO, vault |
| **Board member** | Reads the register and votes on resolutions |
| **Legal auditor** | Reads the register, the audit trail and UBO reports. Changes nothing |
| **Shareholder** | Only **My holdings**: their own shares, certificates (PDF), signatures and open votes |

Invite people on **Members**. A temporary password is shown **once**, so copy it and send it securely. Each person sets up their own two-factor code when they first sign in.

---

## 4. Set up the register (first day)

The **Dashboard** has a **Get started** checklist that ticks itself off as you go.

### 4.1 Create share classes: Setup
1. Open **Setup** and choose **Add share class**.
2. Enter the name (English and Arabic), type, par value, votes per share and authorized shares.
   - Types: *Common (voting)*, *Non-voting economic*, *Preferred / founder*, *Treasury* (for bought-back shares).
   - For preferred classes, also set the **liquidation preference** (for example 1.5x), whether it's **participating**, and its **seniority rank**. The exit waterfall uses these.
3. Save. Create a *Treasury* class if you'll ever buy shares back.

### 4.2 Add shareholders: Setup or Import data
- **One by one:** in **Setup**, choose **Add shareholder**. Pick *Individual* (name, nationality, passport) or *Corporate* (name, registration number).
- **From a spreadsheet:** use **Import data**.
  1. Choose the **Shareholders** tab and click **Download template**.
  2. Fill in one row per shareholder and save it as CSV.
  3. Choose the file, then click **Check file**. Nothing is saved yet. Fix any rows listed in red and check again.
  4. Click **Import** and confirm. Holders already on the register (same name) are skipped.

### 4.3 Record who owns what: issue certificates
- **Existing holdings in bulk:** on **Import data**, open the **Issued shares** tab, use its template and the same check-then-import flow. Holders and classes must already exist and be spelled exactly the same. Each row becomes a numbered certificate.
- **A single issuance:** open **Certificates**, then **Issue certificate**. Choose the shareholder, class, quantity and price per share, and the instrument (shares, option, warrant…). Review the summary and confirm. **A certificate can't be edited after issue.** Errors such as exceeding authorized shares or a price below par appear under the form.

Every certificate has a QR code. Scanning it opens a public verification page that checks the certificate against the register. **Certificates** also lets you download each one as a bilingual PDF.

---

## 5. Everyday work

### See ownership
- **Dashboard:** key numbers, economic vs. voting power, class mix, recent votes and certificates.
- **Cap table:** every holder by class, issued and fully diluted %, votes. Export as CSV or PDF.
- **Ownership tree:** a visual tree. Under a company you see its recorded owners.
- **Search** (top bar, or Ctrl+K): find any holder, certificate, resolution or document.

### Transfer shares or buy them back: Transfers
1. Pick **Transfer** (between holders) or **Buy-back** (into the company treasury).
2. Choose seller, buyer (for a transfer), class and quantity. Price, date, reference and an authorising (passed) resolution are optional, but buy-backs need a price.
3. Click **Record transfer** / **Record buy-back** and check the summary in the confirmation.
4. The old certificates are retired and new ones issued, so the history stays complete. **This can't be undone.** To reverse a transfer, record the opposite one.

### Employee options: Options
1. Issue a certificate with instrument type **Option** (section 4.3).
2. On **Options** it appears under *Grants without a vesting schedule*. Set the vesting start, cliff (months) and total months, then confirm.
3. Each grant card shows exercised / can exercise / unvested and the next vesting date.
4. To exercise, enter a quantity (up to *Can exercise*), optionally choose a different share class, and confirm. Options become shares on new certificates.

### Model a funding round: Funding round
Enter the pre-money valuation, investment, optional option pool % and investor name, then click **Simulate**. You see the price per share, post-money, new shares and everyone's ownership before and after. **Nothing is saved**, so try as many scenarios as you like.

### Model an exit: Exit waterfall
Enter an exit value and click **Calculate**. Preferences are paid by seniority, then the remainder is split by shares. Each preferred class either keeps its preference or converts, whichever pays more. Results show by class and by shareholder.

---

## 6. Board resolutions and voting

1. **Resolutions**, then **New resolution**: title (EN/AR), description, majority (*Ordinary* > 50% or *Special* ≥ 75%), quorum % and a voting deadline. **Create draft**.
2. Open the draft and click **Open voting**. After this the title and terms are locked.
3. Everyone who can vote gets an email with a link as soon as voting opens. Members vote **For / Against / Abstain**. A secretary can also record a vote on behalf of a shareholder (*Record vote for*). **Votes are final.** Shareholders see open votes on **My holdings**.
4. The live tally shows participation against quorum and whether the resolution would pass right now. To nudge people, click **Remind non-voters**: everyone who hasn't voted gets an email (at most once an hour). An automatic reminder also goes out in the last 24 hours before the deadline.
5. **Close and decide** records *Passed* or *Rejected* from the votes cast so far, and everyone is emailed the result. Passed resolutions can then authorise transfers and succession rules.
6. Under **Signatures**, members can sign the resolution with a fresh authenticator code.

---

## 7. Compliance

### Beneficial owners (UBO)
1. Open **Beneficial owners**. For each **corporate** shareholder, record who owns it and their economic and voting %. Owners can themselves be companies, so you can go several levels deep.
2. Set the **threshold** (often 25%). The report lists the natural persons who qualify, those below the threshold, and any **ownership not traced to a natural person**. Fix those gaps by recording the missing owners.
3. Export the report as CSV or PDF for filing.

### Succession rules
Define what happens to shares on an event such as a founder's death, incapacity or exit, a transfer to an heir, or an IPO:
1. **Succession**, then **New rule**: trigger, which holders, from-class → to-class, ratio, beneficiary and legal basis.
2. **Preview** shows exactly which certificates change.
3. **Execute** (with an authorising resolution) retires the old certificates and issues new ones. **This can't be undone.** **Cancel rule** drops a draft.

### Document vault
Upload the articles of association, memorandum, notary receipts, shareholder agreements, minutes and licences (PDF, PNG, JPEG, DOCX or text, up to 10 MB). Each file's SHA-256 fingerprint is recorded and checked on every download.

### Audit trail
Every change is written to an append-only log chained by hashes. **Hash chain intact** means nothing has been altered. If it ever says *broken at entry N*, the record at N was tampered with.

---

## 8. For shareholders

Shareholders sign in and land on **My holdings**:
- shares held, fully diluted, ownership and voting %
- **Votes waiting for you**: click one to vote. A number next to **Resolutions** in the sidebar shows how many are still waiting, and you're emailed when a vote opens, before it closes, and with the result
- their certificates, each with **Download PDF** and **Signatures** to sign it with an authenticator code

---

## 9. Good to know

- **EN / العربية** in the top bar switches language and flips the layout right-to-left. The moon/sun button switches to dark mode.
- Anything permanent (issuing, transfers, exercising, importing, voting, signing, executing rules) asks you to confirm first and shows the details.
- An authenticator code works once. If signing says the code is invalid, wait for the next one.
- Five wrong passwords lock an account for 15 minutes.

## 10. Troubleshooting

| You see | What to do |
|---|---|
| "Finish two-factor setup to unlock your data" | Go to **Security** and confirm a code |
| Pages stay on "Loading…" or show an error | Check the backend is running and `BACKEND_URL` points at its port |
| Import says a holder or class doesn't exist | Import shareholders first, and match names exactly as on the register |
| "Exceeds authorized shares" on issue | Raise authorized shares on the class or issue fewer |
| A menu item is missing | Your role doesn't include it (see section 3) |
| Reset email never arrives | No mail server is configured: copy the link from the backend log |
