import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.stubEnv("VITE_PROJECT_DATA_SOURCE", "local");

afterEach(() => {
  cleanup();
});
