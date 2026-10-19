import { request } from "./client";
import type { SystemStatus } from "./types";

/** Public endpoints: no sign-in needed, so a signed-out visitor still sees a maintenance notice. */
export const systemApi = {
  systemStatus: () => request<SystemStatus>("/api/v1/system/status", {}, false),
  featureFlags: () => request<Record<string, boolean>>("/api/v1/system/flags", {}, false),
};
