import { describe, expect, it } from "vitest";
import {
  calculateCalendarDays,
  calculateCompletionRatio,
  getWarningState,
} from "./progress";

describe("progress utilities", () => {
  it("calculates inclusive calendar days", () => {
    expect(calculateCalendarDays("2026-03-30", "2026-04-19")).toBe(21);
  });

  it("caps in-progress completion at 99 percent when elapsed exceeds planned duration", () => {
    expect(
      calculateCompletionRatio({
        plannedDurationDays: 12,
        elapsedDays: 15,
        isFinished: false,
      }),
    ).toBe(0.99);
  });

  it("marks tasks due within a week", () => {
    expect(getWarningState({ today: "2026-06-19", plannedEndDate: "2026-06-21" })).toBe(
      "within-week",
    );
  });
});
