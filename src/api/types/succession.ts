export type SuccessionTrigger =
  "FOUNDER_DEATH" | "FOUNDER_INCAPACITY" | "FOUNDER_EXIT" | "TRANSFER_TO_HEIR" | "IPO" | "CUSTOM";
export type SuccessionStatus = "DRAFT" | "EXECUTED" | "CANCELLED";
interface NamedRef {
  id: string;
  nameEn: string;
  nameAr: string | null;
}

export interface SuccessionRule {
  id: string;
  name: string;
  trigger: SuccessionTrigger;
  subject: NamedRef | null;
  fromClass: NamedRef;
  toClass: NamedRef;
  ratioNumerator: number;
  ratioDenominator: number;
  beneficiary: NamedRef | null;
  legalReference: string;
  status: SuccessionStatus;
  resolutionId: string | null;
  executedAt: string | null;
  executedBy: string | null;
  createdBy: string;
}

export interface SuccessionRuleInput {
  name: string;
  trigger: SuccessionTrigger;
  subjectId?: string;
  fromClassId: string;
  toClassId: string;
  ratioNumerator: number;
  ratioDenominator: number;
  beneficiaryId?: string;
  legalReference: string;
}

export interface Conversion {
  issuanceId: string;
  certificateNo: string;
  holderId: string;
  holderNameEn: string;
  holderNameAr: string | null;
  fromQuantity: number;
  toHolderId: string;
  toHolderNameEn: string;
  toHolderNameAr: string | null;
  toQuantity: number;
  toPricePerShare: number;
  problem: string | null;
}
