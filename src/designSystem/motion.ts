import type { Transition, Variants } from "motion/react";

/** The house spring: quick to settle, no wobble. Used for anything that moves into place. */
export const spring: Transition = { type: "spring", stiffness: 300, damping: 30 };

/** A tighter spring for small things that follow the pointer or slide between neighbours (nav pill, toasts). */
export const springSnappy: Transition = { type: "spring", stiffness: 500, damping: 38 };

/** A page or card arriving: a short rise and fade. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, y: 0, transition: spring },
};

/** A list whose children (using `rise`) arrive one after another. */
export const stagger: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};
