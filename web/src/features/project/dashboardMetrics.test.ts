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
          taskName: "已完成",
          actualEndDate: "2026-06-03",
          completionRatio: 1,
          warningState: "none",
          elapsedDays: "finished",
        }),
        task({
          id: "active",
          taskName: "进行中",
          actualStartDate: "2026-06-01",
          completionRatio: 0.8,
          warningState: "within-week",
          elapsedDays: 19,
        }),
        task({
          id: "late-start",
          taskName: "延迟启动",
          plannedStartDate: "2026-06-10",
          plannedEndDate: "2026-06-25",
          warningState: "future",
        }),
        task({
          id: "future",
          taskName: "未来未开始",
          plannedStartDate: "2026-07-01",
          plannedEndDate: "2026-07-05",
          warningState: "future",
        }),
      ],
    });

    expect(model.metrics.totalTasks).toBe(4);
    expect(model.metrics.finishedTasks).toBe(1);
    expect(model.metrics.inProgressTasks).toBe(1);
    expect(model.metrics.startDelayedTasks).toBe(1);
    expect(model.metrics.notStartedTasks).toBe(1);
    expect(model.tasks.find((item) => item.id === "late-start")?.dashboardStatus).toBe(
      "start-delayed",
    );
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
    expect(model.tasks.find((item) => item.id === "overdue")?.timeline.leftPercent).toBeGreaterThanOrEqual(
      0,
    );
    expect(model.tasks.find((item) => item.id === "overdue")?.timeline.widthPercent).toBeGreaterThan(
      0,
    );
  });

  it("keeps legacy elapsedDays status compatible when actual dates are missing", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({
          id: "legacy-finished",
          taskName: "历史已完成",
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
    expect(model.metrics.inProgressTasks).toBe(1);
    expect(model.tasks.find((item) => item.id === "legacy-finished")?.dashboardStatus).toBe(
      "finished",
    );
    expect(model.tasks.find((item) => item.id === "legacy-active")?.dashboardStatus).toBe(
      "in-progress",
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
