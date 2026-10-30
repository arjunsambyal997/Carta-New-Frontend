import type { Certificate } from "@/api/types";
import type { Errors } from "@/features/setup/validate";

export interface MoveFields {
  mode: "transfer" | "buyback";
  from: string;
  to: string;
  cls: string;
  qty: string;
  price: string;
}

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

/** Shares a holder can move in one class: their live (ISSUED) share certificates, as the server counts them. */
export function heldShares(certs: Certificate[], holderId: string, classId: string): number {
  return certs
    .filter(
      (c) =>
        c.status === "ISSUED" &&
        c.instrumentType === "SHARES" &&
        c.shareholderId === holderId &&
        c.shareClassId === classId,
    )
    .reduce((sum, c) => sum + c.quantity, 0);
}

/** Mirrors the server's transfer and buy-back checks so a mistake shows next to its field before anything is sent. */
export function validateMove(f: MoveFields, held: number | null): Errors<keyof MoveFields> {
  const e: Errors<keyof MoveFields> = {};
  if (!f.from) e.from = "errRequired";
  if (f.mode === "transfer" && !f.to) e.to = "errRequired";
  if (!f.cls) e.cls = "errRequired";
  const q = num(f.qty);
  if (!(Number.isInteger(q) && q >= 1)) e.qty = "errWholeNumber";
  else if (held != null && q > held) e.qty = "errOverHeld";
  if (f.mode === "buyback" ? !(num(f.price) >= 0) : f.price.trim() !== "" && !(num(f.price) >= 0))
    e.price = "errNotNegative";
  return e;
}
