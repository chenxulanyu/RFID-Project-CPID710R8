import { describe, expect, it } from "vitest";
import { getProjectProgress } from "./projectService";

describe("project service", () => {
  it("loads CPID710R8 mock project data through the service boundary", async () => {
    const data = await getProjectProgress();

    expect(data.project.name).toContain("CPID710R8");
    expect(data.tasks.length).toBeGreaterThan(0);
    expect(data.tasks[0]).toMatchObject({
      id: "M1-001",
      milestoneCode: "M1",
      taskName: "硬件架构选型+关键器件确认",
      plannedDurationDays: 21,
      resourceOwner: "芯联",
      responsiblePerson: "周伟松/唐凯",
    });
  });

  it("derives warning and completion fields from task input", async () => {
    const data = await getProjectProgress("2026-06-19");
    const activeTask = data.tasks.find((task) => task.id === "M5-002");

    expect(activeTask?.completionRatio).toBe(0.99);
    expect(activeTask?.warningState).toBe("overdue");
  });

  it("does not mark finished tasks as overdue after their planned end date", async () => {
    const data = await getProjectProgress("2026-06-19");
    const finishedTask = data.tasks.find((task) => task.id === "M1-001");

    expect(finishedTask?.completionRatio).toBe(1);
    expect(finishedTask?.warningState).toBe("none");
    expect(finishedTask?.overdueDays).toBeUndefined();
  });
});
