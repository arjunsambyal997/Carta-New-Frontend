export interface AuditEntry {
  id: number;
  entityName: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  detail: string | null;
  performedBy: string;
  occurredAt: string;
  hash: string;
}

export interface AuditTrail {
  chainIntact: boolean;
  firstBrokenEntry: number | null;
  entries: AuditEntry[];
}
