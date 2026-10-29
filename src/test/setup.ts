import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { clearRequestCache } from "@/api/cache";

afterEach(() => {
  cleanup();
  localStorage.clear();
  clearRequestCache();
});
