import { org, request } from "./client";
import type { ApiKeyView, WebhookDeliveryView, WebhookView } from "./types";

export const integrationsApi = {
  apiKeys: (orgId: string) => request<ApiKeyView[]>(`${org(orgId)}/api-keys`),
  createApiKey: (orgId: string, name: string) =>
    request<{ key: ApiKeyView; secret: string }>(`${org(orgId)}/api-keys`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  revokeApiKey: (orgId: string, id: string) => request<void>(`${org(orgId)}/api-keys/${id}`, { method: "DELETE" }),
  webhookEvents: (orgId: string) => request<string[]>(`${org(orgId)}/webhook-events`),
  webhooks: (orgId: string) => request<WebhookView[]>(`${org(orgId)}/webhooks`),
  createWebhook: (orgId: string, body: { url: string; events: string[] }) =>
    request<{ webhook: WebhookView; secret: string }>(`${org(orgId)}/webhooks`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateWebhook: (orgId: string, id: string, body: { url?: string; events?: string[]; active?: boolean }) =>
    request<WebhookView>(`${org(orgId)}/webhooks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteWebhook: (orgId: string, id: string) => request<void>(`${org(orgId)}/webhooks/${id}`, { method: "DELETE" }),
  testWebhook: (orgId: string, id: string) => request<void>(`${org(orgId)}/webhooks/${id}/test`, { method: "POST" }),
  webhookDeliveries: (orgId: string, id: string) =>
    request<WebhookDeliveryView[]>(`${org(orgId)}/webhooks/${id}/deliveries`),
  retryDelivery: (orgId: string, deliveryId: string) =>
    request<WebhookDeliveryView>(`${org(orgId)}/webhook-deliveries/${deliveryId}/retry`, { method: "POST" }),
};
