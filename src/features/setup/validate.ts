import type { Key } from "@/context/I18nContext";

export type Errors<F extends string> = Partial<Record<F, Key>>;

export interface ClassFields {
  name: string;
  parValue: string;
  votingMultiplier: string;
  liquidationMultiple: string;
  seniorityRank: string;
  authorizedShares: string;
}

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

/** Share class form rules, mirroring the server's checks so mistakes show next to the field before anything is sent. */
export function validateClass(f: ClassFields): Errors<keyof ClassFields> {
  const e: Errors<keyof ClassFields> = {};
  if (!f.name.trim()) e.name = "errRequired";
  if (!(num(f.parValue) > 0)) e.parValue = "errPositive";
  if (f.votingMultiplier.trim() !== "" && !(num(f.votingMultiplier) >= 0)) e.votingMultiplier = "errNotNegative";
  if (f.liquidationMultiple.trim() !== "" && !(num(f.liquidationMultiple) >= 0))
    e.liquidationMultiple = "errNotNegative";
  if (f.seniorityRank.trim() !== "" && !(Number.isInteger(num(f.seniorityRank)) && num(f.seniorityRank) >= 0))
    e.seniorityRank = "errWholeNumber";
  if (f.authorizedShares.trim() !== "" && !(Number.isInteger(num(f.authorizedShares)) && num(f.authorizedShares) >= 1))
    e.authorizedShares = "errWholeNumber";
  return e;
}

export interface HolderFields {
  holderType: "INDIVIDUAL" | "CORPORATE";
  fullNameEn: string;
  nationality: string;
  dateOfBirth: string;
  email: string;
}

export function validateHolder(f: HolderFields, today = new Date()): Errors<keyof HolderFields> {
  const e: Errors<keyof HolderFields> = {};
  if (!f.fullNameEn.trim()) e.fullNameEn = "errRequired";
  if (f.nationality.trim() !== "" && !/^[A-Za-z]{2}$/.test(f.nationality.trim())) e.nationality = "errCountryCode";
  if (f.holderType === "INDIVIDUAL" && f.dateOfBirth && !(new Date(f.dateOfBirth) < today))
    e.dateOfBirth = "errPastDate";
  if (f.email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "errEmail";
  return e;
}
