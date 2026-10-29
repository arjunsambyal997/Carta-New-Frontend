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
