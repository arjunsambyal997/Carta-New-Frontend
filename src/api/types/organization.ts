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
  requireApproval?: boolean;
  /** Company logo uploaded by the founder or secretary; fetch it from /logo (needs the bearer token). */
  hasLogo?: boolean;
  logoUpdatedAt?: string | null;
}

export interface ShareClassInput {
  name: string;
  nameAr?: string;
  classType: ShareClassType;
  parValue: number;
  currency: string;
  votingMultiplier?: number;
  liquidationMultiple?: number;
  participating: boolean;
  seniorityRank: number;
  authorizedShares?: number;
}

export interface ShareholderInput {
  holderType: "INDIVIDUAL" | "CORPORATE";
  fullNameEn: string;
  fullNameAr?: string;
  nationality?: string;
  passportNo?: string;
  dateOfBirth?: string;
  address?: string;
  registrationNo?: string;
  email?: string;
}
