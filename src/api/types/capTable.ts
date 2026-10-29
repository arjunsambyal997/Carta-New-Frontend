import type { Currency, InstrumentType, ShareClassType } from "./organization";

export interface ShareClass {
  id: string;
  name: string;
  nameAr: string | null;
  classType: ShareClassType;
  parValue: number;
  currency: Currency;
  votingMultiplier: number;
  liquidationMultiple: number;
  participating: boolean;
  authorizedShares: number | null;
}

export interface Shareholder {
  id: string;
  holderType: "INDIVIDUAL" | "CORPORATE";
  fullNameEn: string;
  fullNameAr: string | null;
  nationality: string | null;
}

export interface LedgerEvent {
  date: string;
  type: "ACQUIRED" | "DISPOSED";
  certificateNo: string;
  instrumentType: InstrumentType;
  className: string;
  quantity: number;
  counterpartyEn: string | null;
  counterpartyAr: string | null;
  counterpartyCertificateNo: string | null;
  reason: string;
  sharesAfter: number;
}

export interface Ledger {
  shareholderId: string;
  nameEn: string;
  nameAr: string | null;
  currentShares: number;
  events: LedgerEvent[];
}

export interface LineageNode {
  certificateNo: string;
  status: string;
  instrumentType: InstrumentType;
  holderEn: string;
  holderAr: string | null;
  className: string;
  quantity: number;
  dateIssued: string;
  predecessorNo: string | null;
  reason: string;
  depth: number;
  current: boolean;
}

export interface HolderPosition {
  shareholderId: string;
  nameEn: string;
  nameAr: string | null;
  issuedShares: number;
  fullyDilutedShares: number;
  issuedOwnershipPct: number;
  fullyDilutedOwnershipPct: number;
  votingPower: number;
  votingPct: number;
}

export interface ClassSummary {
  shareClassId: string;
  name: string;
  classType: ShareClassType;
  issuedShares: number;
  fullyDilutedShares: number;
  votingPower: number;
  votingPct: number;
}

export interface CapTable {
  organizationId: string;
  asOf: string;
  totalIssuedShares: number;
  totalFullyDilutedShares: number;
  treasuryShares: number;
  totalVotingPower: number;
  holders: HolderPosition[];
  classes: ClassSummary[];
}

export interface ClassPayout {
  shareClassId: string;
  name: string;
  shares: number;
  invested: number;
  liquidationPreference: number;
  preferencePaid: number;
  converted: boolean;
  residualPaid: number;
  total: number;
  pctOfExit: number;
}

export interface HolderPayout {
  shareholderId: string;
  nameEn: string;
  nameAr: string | null;
  total: number;
  pctOfExit: number;
}

export interface Waterfall {
  organizationId: string;
  exitValue: number;
  commonPricePerShare: number;
  classes: ClassPayout[];
  holders: HolderPayout[];
}
