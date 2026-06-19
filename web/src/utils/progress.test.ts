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

  it("does not return negative days when dates are reversed", () => {
    expect(calculateCalendarDays("2026-06-19", "2026-06-05")).toBe(0);
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

  it("keeps one-day unfinished tasks below the overdue cap on the planned day", () => {
    expect(
      calculateCompletionRatio({
        plannedDurationDays: 1,
        elapsedDays: 1,
        isFinished: false,
      }),
    ).toBe(0.5);
  });

  it("marks tasks due within a week", () => {
    expect(getWarningState({ today: "2026-06-19", plannedEndDate: "2026-06-21" })).toBe(
      "within-week",
    );
  });
});
