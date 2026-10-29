export type ComplianceStatus = "UP_TO_DATE" | "PENDING" | "DUE_SOON" | "OVERDUE";

export interface ComplianceItem {
  key: string;
  titleEn: string;
  titleAr: string;
  basis: string;
  note: string;
  dueDate: string | null;
  status: ComplianceStatus;
  lastFiledOn: string | null;
  lastReference: string | null;
}

export interface ComplianceView {
  jurisdiction: string;
  disclaimer: string;
  items: ComplianceItem[];
}
