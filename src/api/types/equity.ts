import type { Currency } from "./organization";

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
