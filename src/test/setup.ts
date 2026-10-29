import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { MotionGlobalConfig } from "motion/react";
import { clearRequestCache } from "@/api/cache";

afterEach(() => {
  cleanup();
  localStorage.clear();
  clearRequestCache();
});

// Animations finish at once in tests, so exits remove elements without waiting on frames.
MotionGlobalConfig.skipAnimations = true;
