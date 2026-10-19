"use client";

import * as T from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

/** Hover and focus tooltip. `content` can be rich (a few label/value rows); keep it short. */
export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <T.Provider delayDuration={120} skipDelayDuration={300}>
      <T.Root>
        <T.Trigger asChild>{children}</T.Trigger>
        <T.Portal>
          <T.Content
            sideOffset={6}
            className="z-50 max-w-xs rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs text-slate-700 shadow-pop animate-rise"
          >
            {content}
            <T.Arrow className="fill-[rgb(var(--surface))] stroke-slate-200" />
          </T.Content>
        </T.Portal>
      </T.Root>
    </T.Provider>
  );
}
