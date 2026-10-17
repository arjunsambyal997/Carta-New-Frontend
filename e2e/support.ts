import type { Page } from "@playwright/test";

/**
 * Mocks only requests whose path starts with /api/. Do not use a glob such as `**\/api/**`: the Next dev server
 * also serves the app's own `src/api/*` modules and a glob would intercept them.
 */
export async function mockApi(page: Page, routes: Record<string, unknown | ((method: string) => unknown)>) {
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const url = new URL(route.request().url());
      const handler = routes[url.pathname];
      if (handler === undefined) return route.fulfill({ status: 404, json: { detail: `unmocked ${url.pathname}` } });
      const body = typeof handler === "function" ? handler(route.request().method()) : handler;
      if (body === null) return route.fulfill({ status: 202 });
      return route.fulfill({ status: 200, json: body });
    },
  );
}

export const ORG = "11111111-1111-1111-1111-111111111111";

/** Pretends a staff member is signed in, without going through the login form. */
export async function signedIn(page: Page) {
  await page.addInitScript((org) => {
    localStorage.setItem("equigcc.token", "test-token");
    localStorage.setItem("equigcc.orgId", org);
    localStorage.setItem("equigcc.locale", "en");
  }, ORG);
}
