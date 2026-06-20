import { describe, expect, it, vi } from "vitest";
import { getProjectProgress } from "./projectService";
import { LocalProjectRepository } from "./projectRepository";

const factoryState = vi.hoisted(() => ({ useFactoryProject: false }));

vi.mock("./projectRepositoryFactory", async () => {
  const { DefaultProjectRepository, LocalProjectRepository } =
    await vi.importActual<typeof import("./projectRepository")>("./projectRepository");

  return {
    createProjectRepository: vi.fn(() =>
      factoryState.useFactoryProject
        ? LocalProjectRepository.fromSnapshot({
            project: {
              id: "factory-project",
              name: "工厂项目",
              plannedStartDate: "2026-01-01",
              plannedEndDate: "2026-01-31",
              calendarMode: "calendar-days",
            },
            tasks: [],
          })
        : new DefaultProjectRepository(),
    ),
  };
});

describe("project service", () => {
  it("uses the repository factory for default reads", async () => {
    factoryState.useFactoryProject = true;
    const data = await getProjectProgress("2026-06-20");
    factoryState.useFactoryProject = false;

    expect(data.project.id).toBe("factory-project");
  });

  it("loads CPID710R8 mock project data through the service boundary", async () => {
    const data = await getProjectProgress();

    expect(data.project.name).toContain("CPID710R8");
    expect(data.tasks).toHaveLength(31);
    expect([...new Set(data.tasks.map((task) => task.milestoneCode))]).toEqual([
      "M1",
      "M2",
      "M3",
      "M4",
      "M5",
      "M6",
      "M7",
      "M8",
      "M9",
      "M10",
      "M11",
      "M12",
      "M13",
      "M14",
      "M15",
      "M16",
      "M17",
      "M18",
      "M19",
      "M20",
    ]);
    expect(data.tasks.filter((task) => task.milestoneCode === "M5")).toEqual([
      expect.objectContaining({
        id: "M5-001",
        projectContent: "V1.0 EVB PCB",
        taskName: "PCB Layout",
      }),
      expect.objectContaining({
        id: "M5-002",
        projectContent: "V1.0 PCBA打样",
        taskName: "PCB板/屏蔽盖/物料",
      }),
      expect.objectContaining({
        id: "M5-003",
        projectContent: "V1.0 PCBA打样",
        taskName: "PCBA/测试版",
      }),
    ]);
    expect(data.tasks[0]).toMatchObject({
      id: "M1-001",
      milestoneCode: "M1",
      taskName: "硬件架构选型+关键器件确认",
      plannedDurationDays: 21,
      resourceOwner: "芯联",
      responsiblePerson: "周伟松/唐凯",
    });
    expect(data.tasks.at(-1)).toMatchObject({
      id: "M20-001",
      milestoneCode: "M20",
      projectContent: "样机与小批量试产",
      taskName: "样机交付+小批量试产完成",
      plannedStartDate: "2026-09-16",
      plannedEndDate: "2026-10-16",
      responsiblePerson: "颜克志/田超军",
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

  it("falls back to the complete default task seed when repository task data is invalid", async () => {
    const repository = LocalProjectRepository.fromSnapshot({
      project: {
        id: "cpid710r8",
        name: "CPID710R8",
        plannedStartDate: "2026-03-30",
        plannedEndDate: "2026-09-28",
        calendarMode: "calendar-days",
      },
      tasks: [
        {
          id: "legacy-cloudbase-row",
          milestoneCode: "",
          projectContent: "",
          taskName: "",
          plannedStartDate: "2026-03-30",
          plannedEndDate: "2026-04-19",
          resourceOwner: "",
          responsiblePerson: "",
        },
      ],
    });

    const data = await getProjectProgress("2026-06-19", repository);

    expect(data.tasks).toHaveLength(31);
    expect([...new Set(data.tasks.map((task) => task.milestoneCode))]).toHaveLength(20);
  });
});
