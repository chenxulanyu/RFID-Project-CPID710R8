import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DashboardTask } from "./dashboardMetrics";
import { TaskDetailTable } from "./TaskDetailTable";

const tasks: DashboardTask[] = [
  {
    id: "task-1",
    milestoneCode: "M1",
    projectContent: "测试内容",
    taskName: "任务一",
    plannedStartDate: "2026-06-01",
    plannedEndDate: "2026-06-10",
    actualStartDate: "2026-06-01",
    actualEndDate: undefined,
    resourceOwner: "芯联",
    responsiblePerson: "负责人",
    remarks: undefined,
    plannedDurationDays: 10,
    actualDurationDays: undefined,
    elapsedDays: 4,
    completionRatio: 0.42,
    overdueDays: undefined,
    warningState: "future",
    dashboardStatus: "in-progress",
    statusLabel: "进行中",
    riskLabel: undefined,
    timeline: { leftPercent: 10, widthPercent: 20 },
  },
];

describe("TaskDetailTable", () => {
  it("renders completion ratios with a percent suffix", () => {
    render(<TaskDetailTable tasks={tasks} />);

    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("emphasizes project content ahead of task name", () => {
    const { container } = render(<TaskDetailTable tasks={tasks} />);
    expect(container.querySelector("tbody td:nth-child(2)")).toHaveClass("cell-strong");
    expect(container.querySelector("tbody td:nth-child(3)")).not.toHaveClass("cell-strong");
  });
});
