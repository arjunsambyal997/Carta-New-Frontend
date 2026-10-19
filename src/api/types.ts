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
}

/** A register change waiting for (or past) a second person's decision. Also the 202 answer to a gated action. */
export interface PendingChange {
  id: string;
  pending: boolean;
  kind: "ISSUE_CERTIFICATE" | "TRANSFER" | "BUY_BACK" | "EXERCISE_OPTIONS";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  summary: string;
  requestedBy: string;
  requestedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  result: string | null;
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
  /** Latest reminder email, automatic or sent by an officer. */
  lastReminderAt?: string | null;
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
  refreshToken?: string | null;
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

export interface NewCompany {
  legalNameEn: string;
  legalNameAr?: string;
  jurisdiction: Jurisdiction;
  commercialLicenseNo: string;
  baseCurrency: string;
  certificatePrefix: string;
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

export interface OwnershipLink {
  ownerId: string;
  ownerNameEn: string;
  ownerNameAr: string | null;
  ownedId: string;
  ownedNameEn: string;
  ownedNameAr: string | null;
  economicPct: number;
  votingPct: number;
}

export interface UboPath {
  chain: string[];
  economicPct: number;
  votingPct: number;
}

export interface UboPerson {
  shareholderId: string;
  nameEn: string;
  nameAr: string | null;
  nationality: string | null;
  documentNo: string | null;
  economicPct: number;
  votingPct: number;
  qualifiesBy: "ECONOMIC" | "VOTING" | "BOTH" | null;
  direct: boolean;
  paths: UboPath[];
}

export interface UboGap {
  shareholderId: string;
  nameEn: string;
  nameAr: string | null;
  economicPct: number;
  votingPct: number;
  reason: string;
}

export interface UboReport {
  organizationNameEn: string;
  asOf: string;
  thresholdPct: number;
  basis: string;
  beneficialOwners: UboPerson[];
  belowThreshold: UboPerson[];
  gaps: UboGap[];
  warnings: string[];
  disclaimer: string;
}

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

export type VaultCategory =
  | "ARTICLES_OF_ASSOCIATION"
  | "MEMORANDUM"
  | "NOTARY_RECEIPT"
  | "SHAREHOLDER_AGREEMENT"
  | "RESOLUTION_MINUTES"
  | "LICENCE"
  | "OTHER";

export interface VaultDocument {
  id: string;
  title: string;
  category: VaultCategory;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  uploadedBy: string;
  createdAt: string;
}

export interface ImportRowMessage {
  row: number;
  message: string;
}

export interface ImportResult {
  dryRun: boolean;
  rows: number;
  created: number;
  skipped: number;
  errors: ImportRowMessage[];
  warnings: ImportRowMessage[];
}

export interface SearchHit {
  type: "shareholder" | "certificate" | "resolution" | "document" | "shareClass";
  id: string;
  title: string;
  subtitle: string | null;
}

export interface TransferRequest {
  fromShareholderId: string;
  toShareholderId: string;
  shareClassId: string;
  quantity: number;
  pricePerShare?: number;
  date?: string;
  resolutionId?: string;
  reference?: string;
}

export interface BuyBackRequest {
  fromShareholderId: string;
  shareClassId: string;
  quantity: number;
  pricePerShare: number;
  date?: string;
  resolutionId?: string;
  reference?: string;
}

export interface RoundRow {
  shareholderId: string | null;
  name: string;
  sharesBefore: number;
  pctBefore: number;
  sharesAfter: number;
  pctAfter: number;
}

export interface RoundResult {
  preMoney: number;
  investment: number;
  postMoney: number;
  pricePerShare: number;
  sharesBefore: number;
  newInvestorShares: number;
  newPoolShares: number;
  sharesAfter: number;
  investorPct: number;
  poolPct: number;
  rows: RoundRow[];
  convertedShares?: number;
  conversions?: RoundConversion[];
}

export interface RoundConversion {
  name: string;
  kind: "SAFE" | "NOTE";
  amountConverted: number;
  conversionPrice: number;
  shares: number;
  basis: "CAP" | "DISCOUNT" | "ROUND";
}

export interface ConvertibleInput {
  kind: "SAFE" | "NOTE";
  name?: string;
  amount: number;
  capValuation?: number;
  discountPct?: number;
  interestPct?: number;
  months?: number;
}

export interface RoundInput {
  preMoney: number;
  investment: number;
  poolPct?: number;
  investorName?: string;
  convertibles?: ConvertibleInput[];
}

export interface VestingStatus {
  id: string;
  certificateNo: string;
  shareholderId: string;
  holderNameEn: string;
  holderNameAr: string | null;
  shareClassName: string;
  strikePrice: number;
  currency: Currency;
  granted: number;
  exercised: number;
  vested: number;
  exercisable: number;
  unvested: number;
  startDate: string;
  cliffMonths: number;
  vestingMonths: number;
  cliffDate: string;
  fullyVestedDate: string;
  nextVestDate: string | null;
}

export type DocumentType = "RESOLUTION" | "CERTIFICATE";

export interface SignatureView {
  id: string;
  documentType: DocumentType;
  documentRef: string;
  signerName: string;
  signerRole: Role;
  statement: string;
  signedAt: string;
  signatureHash: string;
  valid: boolean;
  documentChanged: boolean;
}

export interface PortalSummary {
  organizationId: string;
  organizationNameEn: string;
  organizationNameAr: string | null;
  shareholderId: string;
  holderNameEn: string;
  holderNameAr: string | null;
  position: { issuedShares: number; fullyDilutedShares: number; ownershipPct: number; votingPct: number };
  certificates: {
    certificateNo: string;
    shareClassName: string;
    instrumentType: InstrumentType;
    quantity: number;
    pricePerShare: number;
    currency: Currency;
    dateIssued: string;
    status: string;
    verificationUrl: string;
  }[];
  openVotes: { id: string; title: string; titleAr: string | null; votingDeadline: string; voted: boolean }[];
}

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
