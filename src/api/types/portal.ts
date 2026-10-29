import type { Role } from "./auth";
import type { Currency, InstrumentType } from "./organization";

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
