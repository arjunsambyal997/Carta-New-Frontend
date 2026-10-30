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
