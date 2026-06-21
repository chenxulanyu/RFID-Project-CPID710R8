import { describe, expect, it } from "vitest";
import type { Project, ProjectTask } from "../../types/project";
import {
  buildDashboardModel,
  getCompletionDeviationLabel,
  getNotStartedCountdownLabel,
  getRiskLabels,
  getStartDeviationLabel,
} from "./dashboardMetrics";

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
    expect(model.metrics.inProgressTasks).toBe(2);
    expect(model.metrics.startDelayedTasks).toBe(1);
    expect(model.metrics.notStartedTasks).toBe(2);
    expect(
      model.metrics.finishedTasks + model.metrics.inProgressTasks + model.metrics.notStartedTasks,
    ).toBe(model.metrics.totalDetailTasks);
    expect(model.tasks.find((item) => item.id === "late-start")?.dashboardStatus).toBe(
      "in-progress",
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
    expect(
      model.metrics.finishedTasks + model.metrics.inProgressTasks + model.metrics.notStartedTasks,
    ).toBe(model.metrics.totalDetailTasks);
    expect(model.riskTasks.map((item) => item.id)).toEqual(["finished-late-start"]);
    expect(model.tasks[0].dashboardStatus).toBe("finished");
    expect(model.tasks[0].riskLabels).toEqual(["延迟启动", "提前1天"]);
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

describe("getStartDeviationLabel", () => {
  it("returns 延迟启动 when actual start is later than planned start", () => {
    expect(
      getStartDeviationLabel(
        task({
          id: "late",
          taskName: "延迟启动",
          plannedStartDate: "2026-06-10",
          actualStartDate: "2026-06-12",
        }),
      ),
    ).toBe("延迟启动");
  });

  it("returns 提前启动 when actual start is earlier than planned start", () => {
    expect(
      getStartDeviationLabel(
        task({
          id: "early",
          taskName: "提前启动",
          plannedStartDate: "2026-06-10",
          actualStartDate: "2026-06-08",
        }),
      ),
    ).toBe("提前启动");
  });

  it("returns undefined when actual start equals planned start", () => {
    expect(
      getStartDeviationLabel(
        task({
          id: "on-time",
          taskName: "按时启动",
          plannedStartDate: "2026-06-10",
          actualStartDate: "2026-06-10",
        }),
      ),
    ).toBeUndefined();
  });

  it("returns undefined when actual start is missing", () => {
    expect(
      getStartDeviationLabel(task({ id: "not-started", taskName: "未开始" })),
    ).toBeUndefined();
  });
});

describe("getCompletionDeviationLabel", () => {
  it("returns 超期X天 when actual end is later than planned end", () => {
    expect(
      getCompletionDeviationLabel(
        task({
          id: "overrun",
          taskName: "超期完成",
          plannedEndDate: "2026-04-13",
          actualStartDate: "2026-04-06",
          actualEndDate: "2026-04-30",
        }),
      ),
    ).toBe("超期17天");
  });

  it("returns 提前X天 when actual end is earlier than planned end", () => {
    expect(
      getCompletionDeviationLabel(
        task({
          id: "early-done",
          taskName: "提前完成",
          plannedEndDate: "2026-04-27",
          actualStartDate: "2026-04-06",
          actualEndDate: "2026-04-25",
        }),
      ),
    ).toBe("提前2天");
  });

  it("returns undefined when actual end equals planned end", () => {
    expect(
      getCompletionDeviationLabel(
        task({
          id: "on-time-done",
          taskName: "按时完成",
          plannedEndDate: "2026-04-19",
          actualStartDate: "2026-03-30",
          actualEndDate: "2026-04-19",
        }),
      ),
    ).toBeUndefined();
  });

  it("returns undefined when actual end is missing", () => {
    expect(
      getCompletionDeviationLabel(
        task({ id: "unfinished", taskName: "未完成", actualStartDate: "2026-04-06" }),
      ),
    ).toBeUndefined();
  });
});

describe("getNotStartedCountdownLabel", () => {
  it("returns 距X天 when today is before planned end", () => {
    expect(
      getNotStartedCountdownLabel(
        task({
          id: "countdown",
          taskName: "未开始未到期",
          plannedEndDate: "2026-06-28",
        }),
        "2026-06-19",
      ),
    ).toBe("9天");
  });

  it("returns 已超期X天 when today is after planned end", () => {
    expect(
      getNotStartedCountdownLabel(
        task({
          id: "past-due",
          taskName: "未开始已超期",
          plannedEndDate: "2026-04-27",
        }),
        "2026-06-19",
      ),
    ).toBe("已超期53天");
  });

  it("returns 今日到期 when today equals planned end", () => {
    expect(
      getNotStartedCountdownLabel(
        task({
          id: "due",
          taskName: "未开始今日到期",
          plannedEndDate: "2026-06-19",
        }),
        "2026-06-19",
      ),
    ).toBe("今日到期");
  });

  it("returns undefined when actual start is present", () => {
    expect(
      getNotStartedCountdownLabel(
        task({
          id: "started",
          taskName: "已开始",
          actualStartDate: "2026-06-01",
          plannedEndDate: "2026-06-28",
        }),
        "2026-06-19",
      ),
    ).toBeUndefined();
  });
});

describe("getRiskLabels", () => {
  it("assembles not-started countdown label with 未开始 prefix", () => {
    expect(
      getRiskLabels(
        task({ id: "countdown", taskName: "未开始", plannedEndDate: "2026-06-28" }),
        "2026-06-19",
      ),
    ).toEqual(["未开始（9天）"]);
  });

  it("assembles 未开始 prefix with 今日到期 countdown", () => {
    expect(
      getRiskLabels(
        task({ id: "due", taskName: "未开始当日", plannedEndDate: "2026-06-19" }),
        "2026-06-19",
      ),
    ).toEqual(["未开始（今日到期）"]);
  });

  it("assembles delayed start plus live overdue for in-progress task", () => {
    expect(
      getRiskLabels(
        task({
          id: "active-late",
          taskName: "延迟启动且延期",
          plannedStartDate: "2026-06-01",
          plannedEndDate: "2026-06-10",
          actualStartDate: "2026-06-03",
          warningState: "overdue",
          overdueDays: 9,
        }),
        "2026-06-19",
      ),
    ).toEqual(["延迟启动", "延期9天"]);
  });

  it("assembles delayed start plus completion overrun for finished task", () => {
    expect(
      getRiskLabels(
        task({
          id: "finished-overrun",
          taskName: "延迟启动且超期",
          plannedStartDate: "2026-03-30",
          plannedEndDate: "2026-04-13",
          actualStartDate: "2026-04-06",
          actualEndDate: "2026-04-30",
          warningState: "none",
        }),
        "2026-06-19",
      ),
    ).toEqual(["延迟启动", "超期17天"]);
  });

  it("falls back to 已完成 when finished task has no deviation", () => {
    expect(
      getRiskLabels(
        task({
          id: "on-time-done",
          taskName: "按时完成",
          plannedStartDate: "2026-03-30",
          plannedEndDate: "2026-04-19",
          actualStartDate: "2026-03-30",
          actualEndDate: "2026-04-19",
          warningState: "none",
        }),
        "2026-06-19",
      ),
    ).toEqual(["已完成"]);
  });

  it("assembles early start plus early completion", () => {
    expect(
      getRiskLabels(
        task({
          id: "early-all",
          taskName: "提前启动提前完成",
          plannedStartDate: "2026-04-06",
          plannedEndDate: "2026-04-27",
          actualStartDate: "2026-03-30",
          actualEndDate: "2026-04-25",
          warningState: "none",
        }),
        "2026-06-19",
      ),
    ).toEqual(["提前启动", "提前2天"]);
  });
});
