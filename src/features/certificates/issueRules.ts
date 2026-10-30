import type { Key } from "@/context/I18nContext";
import type { InstrumentType } from "@/api/types";
import type { Errors } from "@/features/setup/validate";

export interface IssueFields {
  holderId: string;
  classId: string;
  instrument: InstrumentType;
  quantity: string;
  price: string;
}

/** What the chosen class allows: its par value, and how many shares are still free under its authorised limit. */
export interface ClassRoom {
  parValue: number;
  /** null when the class has no authorised limit. */
  left: number | null;
}

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

/** Mirrors the server's issuance checks (positive whole quantity, within authorised shares, not below par for shares). */
export function validateIssue(f: IssueFields, room: ClassRoom | null): Errors<keyof IssueFields> {
  const e: Errors<keyof IssueFields> = {};
  if (!f.holderId) e.holderId = "errRequired";
  if (!f.classId) e.classId = "errRequired";
  const q = num(f.quantity);
  if (!(Number.isInteger(q) && q >= 1)) e.quantity = "errWholeNumber";
  else if (room?.left != null && q > room.left) e.quantity = "errOverAuthorized";
  const p = num(f.price);
  if (!(p >= 0)) e.price = "errNotNegative";
  else if (room && f.instrument === "SHARES" && p < room.parValue) e.price = "errBelowPar";
  return e;
}

/** Fills `{name}` placeholders in a translated sentence. */
export function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

export type { Key };
