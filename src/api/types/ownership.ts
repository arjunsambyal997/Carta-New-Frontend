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
