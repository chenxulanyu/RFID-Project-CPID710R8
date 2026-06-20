import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Project, ProjectTask } from "../../types/project";
import { ProjectTimeline } from "./ProjectTimeline";
import { buildDashboardModel } from "./dashboardMetrics";

const project: Project = {
  id: "cpid710r8",
  name: "CPID710R8 Check Point 定制读写器 - 开发进度管理",
  plannedStartDate: "2026-03-30",
  plannedEndDate: "2026-09-28",
  calendarMode: "calendar-days",
};

function task(overrides: Partial<ProjectTask> & Pick<ProjectTask, "id" | "taskName">): ProjectTask {
  return {
    id: overrides.id,
    milestoneCode: overrides.milestoneCode ?? "M1",
    projectContent: overrides.projectContent ?? "测试项目内容",
    taskName: overrides.taskName,
    plannedStartDate: overrides.plannedStartDate ?? "2026-06-01",
    plannedEndDate: overrides.plannedEndDate ?? "2026-06-10",
    actualStartDate: overrides.actualStartDate,
    actualEndDate: overrides.actualEndDate,
    resourceOwner: overrides.resourceOwner ?? "芯联",
    responsiblePerson: overrides.responsiblePerson ?? "负责人",
    remarks: overrides.remarks,
    plannedDurationDays: overrides.plannedDurationDays ?? 10,
    actualDurationDays: overrides.actualDurationDays,
    elapsedDays: overrides.elapsedDays ?? "not-started",
    completionRatio: overrides.completionRatio ?? 0,
    overdueDays: overrides.overdueDays,
    warningState: overrides.warningState ?? "future",
  };
}

describe("ProjectTimeline", () => {
  it("reserves enough width for percentage labels in progress bars", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({ id: "progress", taskName: "进度任务", actualStartDate: "2026-06-01", completionRatio: 0.95 }),
      ],
    });

    const { container } = render(<ProjectTimeline model={model} />);
    const bar = container.querySelector(".timeline-bar");
    const percent = container.querySelector(".timeline-percent");

    expect(bar).toHaveTextContent("95%");
    expect(percent).toHaveTextContent("95%");
  });

  it("shows start and end dates inside the gantt bar", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({ id: "timeline", taskName: "时间轴任务", actualStartDate: "2026-06-01", completionRatio: 1 }),
      ],
    });

    const { container } = render(<ProjectTimeline model={model} />);
    const bar = container.querySelector(".timeline-bar");

    expect(bar).toHaveTextContent("2026-06-01");
    expect(bar).toHaveTextContent("2026-06-10");
  });
});
