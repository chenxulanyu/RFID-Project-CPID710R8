import { describe, expect, it } from "vitest";
import type { Project, ProjectTaskInput } from "../types/project";
import { LocalProjectRepository } from "./projectRepository";
import { getProjectProgress } from "./projectService";

const project: Project = {
  id: "cpid710r8",
  name: "测试项目",
  plannedStartDate: "2026-03-30",
  plannedEndDate: "2026-09-28",
  calendarMode: "calendar-days",
};

function task(overrides: Partial<ProjectTaskInput> & Pick<ProjectTaskInput, "id" | "taskName">): ProjectTaskInput {
  return {
    id: overrides.id,
    milestoneCode: overrides.milestoneCode ?? "M1",
    projectContent: overrides.projectContent ?? "测试内容",
    taskName: overrides.taskName,
    plannedStartDate: overrides.plannedStartDate ?? "2026-06-01",
    plannedEndDate: overrides.plannedEndDate ?? "2026-06-10",
    actualStartDate: overrides.actualStartDate,
    actualEndDate: overrides.actualEndDate,
    resourceOwner: overrides.resourceOwner ?? "芯联",
    responsiblePerson: overrides.responsiblePerson ?? "负责人",
    remarks: overrides.remarks,
    manualCompletionRatio: overrides.manualCompletionRatio,
    isArchived: overrides.isArchived,
    archivedAt: overrides.archivedAt,
  };
}

describe("admin repository read integration", () => {
  it("hides archived tasks from public project progress reads", async () => {
    const repository = LocalProjectRepository.fromSnapshot({
      project,
      tasks: [
        task({ id: "active", taskName: "活跃任务" }),
        task({ id: "archived", taskName: "归档任务", isArchived: true, archivedAt: "2026-06-19" }),
      ],
    });

    const data = await getProjectProgress("2026-06-19", repository);

    expect(data.tasks.map((item) => item.id)).toEqual(["active"]);
  });

  it("uses manual completion ratio for active unfinished tasks", async () => {
    const repository = LocalProjectRepository.fromSnapshot({
      project,
      tasks: [task({ id: "manual", taskName: "手动进度", manualCompletionRatio: 0.42 })],
    });

    const data = await getProjectProgress("2026-06-19", repository);

    expect(data.tasks[0].completionRatio).toBe(0.42);
  });

  it("treats actual end date as complete even when manual completion is lower", async () => {
    const repository = LocalProjectRepository.fromSnapshot({
      project,
      tasks: [
        task({
          id: "done",
          taskName: "已完成",
          actualStartDate: "2026-06-01",
          actualEndDate: "2026-06-05",
          manualCompletionRatio: 0.4,
        }),
      ],
    });

    const data = await getProjectProgress("2026-06-19", repository);

    expect(data.tasks[0].completionRatio).toBe(1);
    expect(data.tasks[0].elapsedDays).toBe("finished");
  });
});
