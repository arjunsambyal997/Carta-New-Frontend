import type { Currency, InstrumentType } from "./organization";

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
  shareholderId?: string;
  shareholderNameEn: string;
  shareholderNameAr: string | null;
  shareClassId?: string;
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
