"use client";

import { m } from "motion/react";
import type { ComponentProps } from "react";
import { rise, stagger } from "@/designSystem/motion";

/** A list whose items arrive one after another. Put `StaggerItem`s directly inside. */
export function StaggerList(props: ComponentProps<typeof m.ul>) {
  return <m.ul variants={stagger} initial="hidden" animate="shown" {...props} />;
}

export function StaggerItem(props: ComponentProps<typeof m.li>) {
  return <m.li variants={rise} {...props} />;
}
