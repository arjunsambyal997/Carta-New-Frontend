export type Currency = "AED" | "SAR" | "USD" | "QAR" | "BHD" | "KWD" | "OMR";
export type InstrumentType = "SHARES" | "OPTION" | "WARRANT" | "CONVERTIBLE";
export type ShareClassType = "COMMON_VOTING" | "NON_VOTING_ECONOMIC" | "PREFERRED_FOUNDER" | "TREASURY";

export interface Organization {
  id: string;
  legalNameEn: string;
  legalNameAr: string | null;
  jurisdiction: "MAINLAND_UAE" | "ADGM" | "DIFC" | "KSA";
  commercialLicenseNo: string;
  baseCurrency: Currency;
}

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

export interface IssueCertificateRequest {
  shareholderId: string;
  shareClassId: string;
  instrumentType?: InstrumentType;
  quantity: number;
  pricePerShare: number;
  currency?: Currency;
  dateIssued?: string;
}

export interface Certificate {
  id: string;
  certificateNo: string;
  shareholderNameEn: string;
  shareholderNameAr: string | null;
  shareClassName: string;
  instrumentType: InstrumentType;
  quantity: number;
  pricePerShare: number;
  currency: Currency;
  totalConsideration: number;
  dateIssued: string;
  status: string;
  recordHash: string;
  verificationUrl: string;
}

export interface CertificateVerification {
  certificateNo: string;
  issuerNameEn: string;
  issuerNameAr: string | null;
  shareClassName: string;
  quantity: number;
  dateIssued: string;
  status: string;
  authentic: boolean;
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
