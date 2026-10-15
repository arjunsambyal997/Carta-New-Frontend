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

export type ResolutionStatus = "DRAFT" | "ACTIVE" | "PASSED" | "REJECTED";
export type ResolutionThreshold = "ORDINARY" | "SPECIAL";
export type VoteChoice = "FOR" | "AGAINST" | "ABSTAIN";

export interface Tally {
  forWeight: number;
  againstWeight: number;
  abstainWeight: number;
  participationPct: number;
  quorumMet: boolean;
  forPctOfDecided: number;
  wouldPass: boolean;
}

export interface Resolution {
  id: string;
  title: string;
  titleAr: string | null;
  description: string | null;
  threshold: ResolutionThreshold;
  quorumPct: number;
  votingDeadline: string;
  status: ResolutionStatus;
  totalVotingPower: number | null;
  createdBy: string;
  openedAt: string | null;
  closedAt: string | null;
  tally: Tally;
}

export interface ResolutionVote {
  shareholderId: string;
  nameEn: string;
  nameAr: string | null;
  vote: VoteChoice;
  weight: number;
  castAt: string;
}

export interface ResolutionDetail {
  resolution: Resolution;
  votes: ResolutionVote[];
}

export interface CreateResolutionRequest {
  title: string;
  titleAr?: string;
  description?: string;
  threshold: ResolutionThreshold;
  quorumPct: number;
  votingDeadline: string;
}

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

export type Role = "FOUNDER" | "CORPORATE_SECRETARY" | "BOARD_MEMBER" | "SHAREHOLDER" | "LEGAL_AUDITOR";
export type Jurisdiction = "MAINLAND_UAE" | "ADGM" | "DIFC" | "KSA";

export interface AuthResult {
  status: "OK" | "MFA_REQUIRED" | "ORG_SELECTION_REQUIRED";
  accessToken: string | null;
  mfaToken: string | null;
  mfaEnrollmentRequired: boolean;
  organizationId: string | null;
  role: Role | null;
  displayName: string | null;
  organizations: { id: string; name: string; role: Role }[] | null;
}

export interface Enrollment {
  secret: string;
  otpauthUri: string;
}

export interface Me {
  email: string;
  organizationId: string;
  role: Role;
  mfaVerified: boolean;
  shareholderId: string | null;
}

export interface Member {
  email: string;
  displayName: string;
  role: Role;
  shareholderId: string | null;
  shareholderName: string | null;
}

export interface InviteResult {
  email: string;
  role: Role;
  temporaryPassword: string | null;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName: string;
  organization: {
    legalNameEn: string;
    legalNameAr?: string;
    jurisdiction: Jurisdiction;
    commercialLicenseNo: string;
    baseCurrency: string;
    certificatePrefix: string;
  };
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
  registrationNo?: string;
  email?: string;
}
