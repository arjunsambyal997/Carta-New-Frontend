import { request, expect, type APIRequestContext, type Page } from "@playwright/test";

/** The backend the tests talk to directly to create their data (the browser goes through the Next.js proxy). */
export const API = process.env.API_URL ?? "http://localhost:8090";
export const PASSWORD = "Sup3rSecret!Passw0rd";

export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export interface Account {
  email: string;
  password: string;
  orgId: string;
  token: string;
  refresh: string;
  role: string;
  api: APIRequestContext;
}

export interface Org extends Account {
  prefix: string;
  name: string;
}

async function authed(token: string): Promise<APIRequestContext> {
  return request.newContext({ baseURL: API, extraHTTPHeaders: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
}

/** A brand-new organization with a FOUNDER, created through the real sign-up endpoint. */
export async function createOrg(label = "Acme"): Promise<Org> {
  const id = uid();
  const email = `founder-${id}@e2e.test`;
  const prefix = `E${id.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()}`;
  const name = `${label} ${id}`;
  const anon = await request.newContext({ baseURL: API });
  const res = await anon.post("/api/v1/auth/signup", {
    data: {
      email,
      password: PASSWORD,
      displayName: "Fatima Founder",
      organization: { legalNameEn: name, legalNameAr: "شركة الاختبار", jurisdiction: "ADGM", commercialLicenseNo: `LIC-${id}`, baseCurrency: "AED", certificatePrefix: prefix },
    },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = await res.json();
  await anon.dispose();
  return { email, password: PASSWORD, orgId: body.organizationId, token: body.accessToken, refresh: body.refreshToken, role: "FOUNDER", prefix, name, api: await authed(body.accessToken) };
}

/** Signs an existing account in (needs DEV_SKIP_MFA on the backend). */
export async function loginAs(email: string, password: string, orgId: string, role: string): Promise<Account> {
  const anon = await request.newContext({ baseURL: API });
  const res = await anon.post("/api/v1/auth/login", { data: { email, password, organizationId: orgId } });
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = await res.json();
  expect(body.status, JSON.stringify(body)).toBe("OK");
  await anon.dispose();
  return { email, password, orgId, token: body.accessToken, refresh: body.refreshToken, role, api: await authed(body.accessToken) };
}

/** Starts the browser already signed in, the same way the app stores a session after login. */
export async function signIn(page: Page, a: Pick<Account, "token" | "orgId" | "refresh">) {
  await page.addInitScript(([t, o, r]) => {
    // seed once per tab: later page loads must keep whatever the app stored itself (for example after switching company)
    if (sessionStorage.getItem("e2e.seeded")) return;
    sessionStorage.setItem("e2e.seeded", "1");
    localStorage.setItem("equigcc.token", t);
    localStorage.setItem("equigcc.orgId", o);
    localStorage.setItem("equigcc.refresh", r);
  }, [a.token, a.orgId, a.refresh]);
}

const base = (a: Account) => `/api/v1/organizations/${a.orgId}`;

async function ok<T = any>(res: import("@playwright/test").APIResponse): Promise<T> {
  expect(res.ok(), `${res.url()} -> ${res.status()} ${await res.text()}`).toBeTruthy();
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function post<T = any>(a: Account, path: string, data?: unknown): Promise<T> {
  return ok<T>(await a.api.post(`${base(a)}${path}`, { data }));
}

export async function put<T = any>(a: Account, path: string, data?: unknown): Promise<T> {
  return ok<T>(await a.api.put(`${base(a)}${path}`, { data }));
}

export async function get<T = any>(a: Account, path: string): Promise<T> {
  return ok<T>(await a.api.get(`${base(a)}${path}`));
}

export const seedClass = (a: Account, o: Record<string, unknown> = {}) =>
  post(a, "/share-classes", { name: "Ordinary", nameAr: "عادية", classType: "COMMON_VOTING", parValue: 1, currency: "AED", votingMultiplier: 1, authorizedShares: 10_000_000, ...o });

export const seedHolder = (a: Account, fullNameEn: string, o: Record<string, unknown> = {}) =>
  post(a, "/shareholders", { holderType: "INDIVIDUAL", fullNameEn, fullNameAr: null, nationality: "AE", passportNo: `P${uid().slice(0, 7)}`, ...o });

export const seedIssue = (a: Account, shareholderId: string, shareClassId: string, quantity: number, pricePerShare = 10, o: Record<string, unknown> = {}) =>
  post(a, "/certificates", { shareholderId, shareClassId, quantity, pricePerShare, dateIssued: "2025-01-01", ...o });

/** A founder with one class, two holders and some shares: the starting point for most tests. */
export async function seedRegister(label = "Acme") {
  const org = await createOrg(label);
  const cls = await seedClass(org);
  const fatima = await seedHolder(org, "Fatima Al Mansoori", { fullNameAr: "فاطمة المنصوري", email: `fatima-${uid()}@e2e.test` });
  const omar = await seedHolder(org, "Omar Haddad", { email: `omar-${uid()}@e2e.test` });
  const c1 = await seedIssue(org, fatima.id, cls.id, 1000, 10);
  return { org, cls, fatima, omar, c1 };
}

export const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

/** Invites a member and signs them in. */
export async function addMember(org: Org, role: string, label = role.toLowerCase(), shareholderId?: string): Promise<Account> {
  const email = `${label}-${uid()}@e2e.test`;
  const res = await post(org, "/members", { email, displayName: label, role, shareholderId });
  return loginAs(email, res.temporaryPassword, org.orgId, role);
}

/** A realistic register: several classes and holders, options with vesting, a transfer, an open vote and a passed one. */
export async function seedRich(label = "Gulf Ventures") {
  const org = await createOrg(label);
  const ordinary = await seedClass(org, { name: "Ordinary", nameAr: "عادية" });
  const founder = await seedClass(org, { name: "Founder preferred", nameAr: "تفضيلية للمؤسس", classType: "PREFERRED_FOUNDER", votingMultiplier: 10, liquidationMultiple: 1, seniorityRank: 2 });
  const seriesA = await seedClass(org, { name: "Series A preferred", classType: "PREFERRED_FOUNDER", votingMultiplier: 1, liquidationMultiple: 1.5, participating: true, seniorityRank: 1 });
  const nonVoting = await seedClass(org, { name: "Non-voting", classType: "NON_VOTING_ECONOMIC", votingMultiplier: 0 });
  const holders: Record<string, any> = {};
  for (const [key, name, ar] of [["fatima", "Fatima Al Mansoori", "فاطمة المنصوري"], ["omar", "Omar Haddad", "عمر حداد"], ["layla", "Layla Qasim", "ليلى قاسم"], ["yusuf", "Yusuf Al Nuaimi", null], ["sara", "Sara Khalil", null]] as const) {
    holders[key] = await seedHolder(org, name, { fullNameAr: ar, email: `${key}-${uid()}@e2e.test` });
  }
  holders.holding = await seedHolder(org, "Al Mansoori Family Holding Ltd", { holderType: "CORPORATE", fullNameAr: "شركة المنصوري العائلية القابضة", passportNo: null, nationality: null, registrationNo: `REG-${uid()}` });
  holders.fund = await seedHolder(org, "Falcon Growth Fund", { holderType: "CORPORATE", passportNo: null, nationality: null, registrationNo: `REG-${uid()}` });
  await seedIssue(org, holders.fatima.id, founder.id, 100_000, 1);
  await seedIssue(org, holders.holding.id, ordinary.id, 600_000, 2);
  await seedIssue(org, holders.omar.id, ordinary.id, 120_000, 5);
  await seedIssue(org, holders.layla.id, ordinary.id, 80_000, 5);
  await seedIssue(org, holders.fund.id, seriesA.id, 150_000, 12, { dateIssued: "2025-06-01" });
  await seedIssue(org, holders.sara.id, nonVoting.id, 40_000, 3);
  const grant = await seedIssue(org, holders.yusuf.id, ordinary.id, 48_000, 2.5, { instrumentType: "OPTION", dateIssued: "2025-02-01" });
  await put(org, `/certificates/${grant.certificateNo}/vesting`, { startDate: "2025-02-01", cliffMonths: 12, vestingMonths: 48 });
  await put(org, `/shareholders/${holders.holding.id}/owners`, { owners: [{ ownerId: holders.fatima.id, economicPct: 60 }, { ownerId: holders.layla.id, economicPct: 40 }] });
  await post(org, "/transfers", { fromShareholderId: holders.omar.id, toShareholderId: holders.sara.id, shareClassId: ordinary.id, quantity: 20_000, pricePerShare: 6, date: "2025-09-01", reference: "SPA-2025-09" });

  const secretary = await addMember(org, "CORPORATE_SECRETARY", "secretary");
  const passed = await post(org, "/resolutions", { title: "Approve the 2026 budget", titleAr: "اعتماد ميزانية 2026", description: "Annual operating budget of AED 4.2m.", threshold: "ORDINARY", quorumPct: 50, votingDeadline: inDays(2) });
  await post(org, `/resolutions/${passed.id}/open`);
  await post(secretary, `/resolutions/${passed.id}/votes`, { vote: "FOR", shareholderId: holders.holding.id });
  await post(secretary, `/resolutions/${passed.id}/votes`, { vote: "FOR", shareholderId: holders.fatima.id });
  await post(org, `/resolutions/${passed.id}/close`);
  const open = await post(org, "/resolutions", { title: "Appoint a new auditor", titleAr: "تعيين مدقق جديد", description: "Appoint a new statutory auditor for 2026.", threshold: "SPECIAL", quorumPct: 60, votingDeadline: inDays(7) });
  await post(org, `/resolutions/${open.id}/open`);
  await post(secretary, `/resolutions/${open.id}/votes`, { vote: "FOR", shareholderId: holders.fatima.id });
  await post(org, "/resolutions", { title: "Issue Series B shares", description: "Draft: to be discussed.", votingDeadline: inDays(14) });
  return { org, secretary, ordinary, founder, seriesA, nonVoting, holders, grant, passed, open };
}
