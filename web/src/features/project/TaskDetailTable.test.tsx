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
    riskLabels: [],
    timeline: { plan: { leftPercent: 10, widthPercent: 20 }, percent: 50 },
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

  it("renders planned duration column with day count", () => {
    render(<TaskDetailTable tasks={tasks} />);
    expect(screen.getByText("10天")).toBeInTheDocument();
  });

  it("renders actual duration as 进行中 when only actual start is present", () => {
    render(<TaskDetailTable tasks={tasks} />);
    // task-1 只有 actualStartDate，无 actualEndDate -> 进行中
    expect(screen.getAllByText("进行中").length).toBeGreaterThan(0);
  });

  it("renders actual duration as - when task not started", () => {
    const notStarted: DashboardTask[] = [
      {
        id: "task-ns",
        milestoneCode: "M2",
        projectContent: "未开始内容",
        taskName: "未开始任务",
        plannedStartDate: "2026-06-01",
        plannedEndDate: "2026-06-10",
        actualStartDate: undefined,
        actualEndDate: undefined,
        resourceOwner: "芯联",
        responsiblePerson: "负责人",
        remarks: undefined,
        plannedDurationDays: 10,
        actualDurationDays: undefined,
        elapsedDays: "not-started",
        completionRatio: 0,
        overdueDays: undefined,
        warningState: "future",
        dashboardStatus: "not-started",
        statusLabel: "未开始",
        riskLabels: ["未开始（距9天）"],
        timeline: { plan: { leftPercent: 10, widthPercent: 20 }, percent: 0 },
      },
    ];
    const { container } = render(<TaskDetailTable tasks={notStarted} />);
    // 实际工期单元格应显示 "-"
    const durationCells = container.querySelectorAll(".duration-cell");
    expect(durationCells[1].textContent).toBe("-");
  });

  it("renders actual duration day count when both actual dates present", () => {
    const finished: DashboardTask[] = [
      {
        id: "task-done",
        milestoneCode: "M1",
        projectContent: "已完成内容",
        taskName: "已完成任务",
        plannedStartDate: "2026-03-30",
        plannedEndDate: "2026-04-19",
        actualStartDate: "2026-03-30",
        actualEndDate: "2026-04-19",
        resourceOwner: "芯联",
        responsiblePerson: "负责人",
        remarks: undefined,
        plannedDurationDays: 21,
        actualDurationDays: 21,
        elapsedDays: "finished",
        completionRatio: 1,
        overdueDays: undefined,
        warningState: "none",
        dashboardStatus: "finished",
        statusLabel: "已完成",
        riskLabels: ["已完成"],
        timeline: { plan: { leftPercent: 0, widthPercent: 20 }, percent: 100 },
      },
    ];
    const { container } = render(<TaskDetailTable tasks={finished} />);
    const durationCells = container.querySelectorAll(".duration-cell");
    expect(durationCells[0].textContent).toBe("21天");
    expect(durationCells[1].textContent).toBe("21天");
  });

  it("renders multi-label status joined by 、 for delayed start plus overrun", () => {
    const overdue: DashboardTask[] = [
      {
        id: "task-overrun",
        milestoneCode: "M2",
        projectContent: "超期内容",
        taskName: "延迟启动且超期",
        plannedStartDate: "2026-03-30",
        plannedEndDate: "2026-04-13",
        actualStartDate: "2026-04-06",
        actualEndDate: "2026-04-30",
        resourceOwner: "芯联",
        responsiblePerson: "负责人",
        remarks: undefined,
        plannedDurationDays: 15,
        actualDurationDays: 25,
        elapsedDays: "finished",
        completionRatio: 1,
        overdueDays: undefined,
        warningState: "none",
        dashboardStatus: "finished",
        statusLabel: "已完成",
        riskLabels: ["延迟启动", "超期17天"],
        timeline: { plan: { leftPercent: 0, widthPercent: 20 }, percent: 100 },
      },
    ];
    const { container } = render(<TaskDetailTable tasks={overdue} />);
    const badge = container.querySelector(".status-badge");
    expect(badge?.textContent).toBe("延迟启动、超期17天");
  });

  it("renders statusLabel fallback when riskLabels is empty", () => {
    const clean: DashboardTask[] = [
      {
        id: "task-clean",
        milestoneCode: "M1",
        projectContent: "正常内容",
        taskName: "按时完成",
        plannedStartDate: "2026-03-30",
        plannedEndDate: "2026-04-19",
        actualStartDate: "2026-03-30",
        actualEndDate: "2026-04-19",
        resourceOwner: "芯联",
        responsiblePerson: "负责人",
        remarks: undefined,
        plannedDurationDays: 21,
        actualDurationDays: 21,
        elapsedDays: "finished",
        completionRatio: 1,
        overdueDays: undefined,
        warningState: "none",
        dashboardStatus: "finished",
        statusLabel: "已完成",
        riskLabels: [],
        timeline: { plan: { leftPercent: 0, widthPercent: 20 }, percent: 100 },
      },
    ];
    render(<TaskDetailTable tasks={clean} />);
    expect(screen.getByText("已完成")).toBeInTheDocument();
  });

  it("renders each label as a span with the matching tag class", () => {
    const overdue: DashboardTask[] = [
      {
        id: "task-overrun-2",
        milestoneCode: "M2",
        projectContent: "超期内容",
        taskName: "延迟启动且超期",
        plannedStartDate: "2026-03-30",
        plannedEndDate: "2026-04-13",
        actualStartDate: "2026-04-06",
        actualEndDate: "2026-04-30",
        resourceOwner: "芯联",
        responsiblePerson: "负责人",
        remarks: undefined,
        plannedDurationDays: 15,
        actualDurationDays: 25,
        elapsedDays: "finished",
        completionRatio: 1,
        overdueDays: undefined,
        warningState: "none",
        dashboardStatus: "finished",
        statusLabel: "已完成",
        riskLabels: ["延迟启动", "超期17天"],
        timeline: { plan: { leftPercent: 0, widthPercent: 20 }, percent: 100 },
      },
    ];
    const { container } = render(<TaskDetailTable tasks={overdue} />);
    const badge = container.querySelector(".status-badge");
    expect(badge).not.toBeNull();
    const startSpan = badge!.querySelector(".tag-warning");
    const overdueSpan = badge!.querySelector(".tag-overdue");
    expect(startSpan?.textContent).toBe("延迟启动");
    expect(overdueSpan?.textContent).toBe("超期17天");
  });

  it("renders early labels with the tag-early class", () => {
    const early: DashboardTask[] = [
      {
        id: "task-early",
        milestoneCode: "M1",
        projectContent: "提前内容",
        taskName: "提前启动提前完成",
        plannedStartDate: "2026-04-06",
        plannedEndDate: "2026-04-27",
        actualStartDate: "2026-03-30",
        actualEndDate: "2026-04-25",
        resourceOwner: "芯联",
        responsiblePerson: "负责人",
        remarks: undefined,
        plannedDurationDays: 22,
        actualDurationDays: 27,
        elapsedDays: "finished",
        completionRatio: 1,
        overdueDays: undefined,
        warningState: "none",
        dashboardStatus: "finished",
        statusLabel: "已完成",
        riskLabels: ["提前启动", "提前2天"],
        timeline: { plan: { leftPercent: 0, widthPercent: 20 }, percent: 100 },
      },
    ];
    const { container } = render(<TaskDetailTable tasks={early} />);
    const badge = container.querySelector(".status-badge");
    const earlySpans = badge!.querySelectorAll(".tag-early");
    expect(earlySpans).toHaveLength(2);
    expect(earlySpans[0].textContent).toBe("提前启动");
    expect(earlySpans[1].textContent).toBe("提前2天");
  });
});
