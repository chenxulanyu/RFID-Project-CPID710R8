import { describe, expect, it } from "vitest";
import { formatPercent } from "./formatters";

describe("formatPercent", () => {
  it("formats ratios as percent strings", () => {
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(0.42)).toBe("42%");
    expect(formatPercent(1)).toBe("100%");
  });
});
