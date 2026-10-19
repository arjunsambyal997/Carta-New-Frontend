import type { ReactNode } from "react";

/** Inline message under a form field; pair the input with aria-invalid and aria-describedby={id}. */
export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-700">
      {children}
    </p>
  );
}
