export interface ChecklistInput {
  hasLogo: boolean;
  classes: number;
  holders: number;
  members: number;
  certificates: number;
  resolutions: number;
}

export interface ChecklistStep {
  key: "company" | "logo" | "classes" | "holders" | "team" | "certificate" | "resolution";
  href: string;
  done: boolean;
  optional?: boolean;
}

/** The first-run steps in order. The company exists from sign-up, so that step is always done; logo and team are optional. */
export function checklistSteps(i: ChecklistInput): ChecklistStep[] {
  return [
    { key: "company", href: "/setup", done: true },
    { key: "logo", href: "/setup", done: i.hasLogo, optional: true },
    { key: "classes", href: "/setup", done: i.classes > 0 },
    { key: "holders", href: "/import", done: i.holders > 0 },
    { key: "team", href: "/members", done: i.members > 1, optional: true },
    { key: "certificate", href: "/certificates/new", done: i.certificates > 0 },
    { key: "resolution", href: "/resolutions", done: i.resolutions > 0 },
  ];
}

export function checklistProgress(steps: ChecklistStep[]): {
  done: number;
  total: number;
  pct: number;
  complete: boolean;
} {
  const done = steps.filter((s) => s.done).length;
  const required = steps.filter((s) => !s.optional);
  return {
    done,
    total: steps.length,
    pct: Math.round((done / steps.length) * 100),
    complete: required.every((s) => s.done),
  };
}
