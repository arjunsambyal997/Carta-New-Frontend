import { ApiError, org, request } from "./client";

export interface AnalyticsEmbed {
  url: string;
  expiresAt: string;
}

export const analyticsApi = {
  /** A signed link to this company's dashboard, or null when analytics is not set up (the API answers 404). */
  analyticsEmbed: (orgId: string) =>
    request<AnalyticsEmbed>(`${org(orgId)}/analytics/embed`, { cache: "no-store" }).catch((e: unknown) => {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }),
};
