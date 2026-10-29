export interface ApiKeyView {
  id: string;
  name: string;
  keyPrefix: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface WebhookView {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export type DeliveryStatus = "PENDING" | "DELIVERED" | "FAILED";

export interface WebhookDeliveryView {
  id: string;
  eventType: string;
  status: DeliveryStatus;
  attempts: number;
  responseCode: number | null;
  lastError: string | null;
  createdAt: string;
  nextAttemptAt: string | null;
  deliveredAt: string | null;
}
