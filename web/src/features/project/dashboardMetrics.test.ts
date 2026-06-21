import { describe, expect, it } from "vitest";
import type { Project, ProjectTask } from "../../types/project";
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

describe("dashboardMetrics", () => {
  it("derives task status counts including delayed starts", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({
          id: "done",
          milestoneCode: "M1",
          taskName: "已完成",
          actualEndDate: "2026-06-03",
          completionRatio: 1,
          warningState: "none",
          elapsedDays: "finished",
        }),
        task({
          id: "active",
          milestoneCode: "M2",
          taskName: "进行中",
          actualStartDate: "2026-06-01",
          completionRatio: 0.8,
          warningState: "within-week",
          elapsedDays: 19,
        }),
        task({
          id: "late-start",
          milestoneCode: "M3",
          taskName: "延迟启动",
          plannedStartDate: "2026-06-10",
          plannedEndDate: "2026-06-25",
          actualStartDate: "2026-06-12",
          completionRatio: 0.1,
          elapsedDays: 8,
          warningState: "future",
        }),
        task({
          id: "missing-actual-start",
          milestoneCode: "M4",
          taskName: "未填实际开始",
          plannedStartDate: "2026-06-01",
          plannedEndDate: "2026-06-05",
          warningState: "future",
        }),
        task({
          id: "future",
          milestoneCode: "M5",
          taskName: "未来未开始",
          plannedStartDate: "2026-07-01",
          plannedEndDate: "2026-07-05",
          warningState: "future",
        }),
      ],
    });

    expect(model.metrics.totalTasks).toBe(5);
    expect(model.metrics.finishedTasks).toBe(1);
    expect(model.metrics.inProgressTasks).toBe(1);
    expect(model.metrics.startDelayedTasks).toBe(1);
    expect(model.metrics.notStartedTasks).toBe(2);
    expect(model.tasks.find((item) => item.id === "late-start")?.dashboardStatus).toBe(
      "start-delayed",
    );
    expect(model.tasks.find((item) => item.id === "missing-actual-start")?.dashboardStatus).toBe(
      "not-started",
    );
  });

  it("does not count tasks with on-time or early actual starts as delayed starts", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({
          id: "early",
          taskName: "提前启动",
          plannedStartDate: "2026-06-10",
          plannedEndDate: "2026-06-20",
          actualStartDate: "2026-06-08",
          elapsedDays: 12,
          completionRatio: 0.4,
        }),
        task({
          id: "on-time",
          taskName: "按时启动",
          plannedStartDate: "2026-06-10",
          plannedEndDate: "2026-06-20",
          actualStartDate: "2026-06-10",
          elapsedDays: 10,
          completionRatio: 0.5,
        }),
      ],
    });

    expect(model.metrics.startDelayedTasks).toBe(0);
    expect(model.metrics.notStartedTasks).toBe(0);
    expect(model.tasks.map((item) => item.dashboardStatus)).toEqual(["in-progress", "in-progress"]);
  });

  it("counts completed tasks with late actual starts in delayed-start metrics", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({
          id: "finished-late-start",
          taskName: "晚启动但已完成",
          plannedStartDate: "2026-06-01",
          plannedEndDate: "2026-06-10",
          actualStartDate: "2026-06-03",
          actualEndDate: "2026-06-09",
          elapsedDays: "finished",
          completionRatio: 1,
          warningState: "none",
        }),
      ],
    });

    expect(model.metrics.finishedTasks).toBe(1);
    expect(model.metrics.startDelayedTasks).toBe(1);
    expect(model.riskTasks.map((item) => item.id)).toEqual(["finished-late-start"]);
    expect(model.tasks[0].dashboardStatus).toBe("finished");
    expect(model.tasks[0].riskLabel).toBe("延迟启动");
  });

  it("counts total tasks by unique milestone code while preserving detail rows", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({ id: "m5-1", milestoneCode: "M5", taskName: "PCB Layout" }),
        task({ id: "m5-2", milestoneCode: "M5", taskName: "PCB板/屏蔽盖/物料" }),
        task({ id: "m6-1", milestoneCode: "M6", taskName: "完成单片机测试固件" }),
      ],
    });

    expect(model.metrics.totalTasks).toBe(2);
    expect(model.tasks).toHaveLength(3);
  });

  it("collects risk tasks and timeline ranges", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({
          id: "overdue",
          taskName: "延期任务",
          plannedStartDate: "2026-06-01",
          plannedEndDate: "2026-06-10",
          actualStartDate: "2026-06-01",
          warningState: "overdue",
          overdueDays: 9,
          completionRatio: 0.99,
          elapsedDays: 19,
        }),
        task({
          id: "due",
          taskName: "今日到期",
          plannedStartDate: "2026-06-15",
          plannedEndDate: "2026-06-19",
          actualStartDate: "2026-06-15",
          warningState: "due-today",
          completionRatio: 0.8,
          elapsedDays: 5,
        }),
        task({
          id: "ok",
          taskName: "正常任务",
          plannedStartDate: "2026-08-01",
          plannedEndDate: "2026-08-05",
          warningState: "future",
        }),
      ],
    });

    expect(model.metrics.overdueTasks).toBe(1);
    expect(model.metrics.dueTodayTasks).toBe(1);
    expect(model.riskTasks.map((item) => item.id)).toEqual(["overdue", "due"]);
    expect(model.timelineRange.startDate).toBe("2026-03-30");
    expect(model.timelineRange.endDate).toBe("2026-09-28");
    expect(model.tasks.find((item) => item.id === "overdue")?.timeline.plan.leftPercent).toBeGreaterThanOrEqual(
      0,
    );
    expect(model.tasks.find((item) => item.id === "overdue")?.timeline.plan.widthPercent).toBeGreaterThan(
      0,
    );
  });

  it("does not infer active status from elapsed days when actual start is missing", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({
          id: "legacy-finished",
          taskName: "历史已完成",
          actualEndDate: "2026-06-10",
          elapsedDays: "finished",
          completionRatio: 1,
        }),
        task({
          id: "legacy-active",
          taskName: "历史进行中",
          elapsedDays: 4,
          completionRatio: 0.4,
        }),
      ],
    });

    expect(model.metrics.finishedTasks).toBe(1);
    expect(model.metrics.inProgressTasks).toBe(0);
    expect(model.metrics.notStartedTasks).toBe(1);
    expect(model.tasks.find((item) => item.id === "legacy-finished")?.dashboardStatus).toBe(
      "finished",
    );
    expect(model.tasks.find((item) => item.id === "legacy-active")?.dashboardStatus).toBe(
      "not-started",
    );
  });

  it("treats actual dates as authoritative when elapsedDays is inconsistent", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({
          id: "finished-conflict",
          taskName: "已完成冲突数据",
          actualEndDate: "2026-06-10",
          elapsedDays: 10,
          completionRatio: 1,
        }),
      ],
    });

    expect(model.metrics.finishedTasks).toBe(1);
    expect(model.metrics.inProgressTasks).toBe(0);
    expect(model.tasks[0].dashboardStatus).toBe("finished");
  });

  it("derives the current date position inside the timeline range", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-29",
      tasks: [task({ id: "task", taskName: "时间轴任务" })],
    });

    expect(model.timelineRange.todayPercent).toBeGreaterThan(49);
    expect(model.timelineRange.todayPercent).toBeLessThan(51);
  });
});
