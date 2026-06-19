import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getProjectProgress } from "../../services/projectService";
import { FoundationPage } from "./FoundationPage";

vi.mock("../../services/projectService", () => ({
  getProjectProgress: vi.fn(() =>
    Promise.resolve({
      project: {
        id: "cpid710r8",
        name: "CPID710R8 Test Project",
        plannedStartDate: "2026-03-30",
        plannedEndDate: "2026-12-31",
        calendarMode: "calendar-days",
      },
      tasks: [],
    }),
  ),
}));

describe("FoundationPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads project progress using the current calendar date", async () => {
    const expectedToday = new Date().toISOString().slice(0, 10);

    render(<FoundationPage />);

    await waitFor(() => {
      expect(getProjectProgress).toHaveBeenCalledWith(expectedToday);
    });
  });
});
