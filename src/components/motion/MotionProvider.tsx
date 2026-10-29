"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { spring } from "@/designSystem/motion";

const loadFeatures = () => import("./features").then((r) => r.default);

/**
 * Loads the animation features once for the whole app (in their own chunk, after first paint) and sets the defaults every animation shares.
 * `reducedMotion="user"` turns movement off for people who ask their OS for less motion; fades still run.
 * `strict` makes a stray `motion.div` (which would pull in the full bundle) fail loudly; use `m.div` instead.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={spring}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
