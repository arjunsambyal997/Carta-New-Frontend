"use client";

import { m } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { rise } from "@/designSystem/motion";

/**
 * Each route arrives with a short rise. Entrance only: the App Router swaps a page's content at once, so an exit
 * animation would show the new page's content fading out.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <m.div key={path} variants={rise} initial="hidden" animate="shown">
      {children}
    </m.div>
  );
}
