export * from "./client";

import { authApi } from "./auth";
import { organizationApi } from "./organization";
import { capTableApi } from "./capTable";
import { certificatesApi } from "./certificates";
import { governanceApi } from "./governance";
import { ownershipApi } from "./ownership";
import { successionApi } from "./succession";
import { vaultApi } from "./vault";
import { auditApi } from "./audit";
import { registerToolsApi } from "./registerTools";
import { equityApi } from "./equity";
import { portalApi } from "./portal";

/** One object for callers that want `api.something()`; each resource also exports its own `<name>Api`. */
export const api = {
  ...authApi,
  ...organizationApi,
  ...capTableApi,
  ...certificatesApi,
  ...governanceApi,
  ...ownershipApi,
  ...successionApi,
  ...vaultApi,
  ...auditApi,
  ...registerToolsApi,
  ...equityApi,
  ...portalApi,
};
export { authApi } from "./auth";
export { organizationApi } from "./organization";
export { capTableApi } from "./capTable";
export { certificatesApi } from "./certificates";
export { governanceApi } from "./governance";
export { ownershipApi } from "./ownership";
export { successionApi } from "./succession";
export { vaultApi } from "./vault";
export { auditApi } from "./audit";
export { registerToolsApi } from "./registerTools";
export { equityApi } from "./equity";
export { portalApi } from "./portal";
