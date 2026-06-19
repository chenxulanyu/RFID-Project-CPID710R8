import type { Project, ProjectTask } from "../../types/project";
import { calculateCalendarDays } from "../../utils/progress";

export type DashboardTaskStatus = "finished" | "in-progress" | "start-delayed" | "not-started";

export interface DashboardTask extends ProjectTask {
  dashboardStatus: DashboardTaskStatus;
  statusLabel: string;
  riskLabel?: string;
  timeline: {
    leftPercent: number;
    widthPercent: number;
  };
}

export interface DashboardMetrics {
  totalTasks: number;
  finishedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  startDelayedTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  withinWeekTasks: number;
  overallProgress: number;
}

export interface DashboardModel {
  project: Project;
  today: string;
  metrics: DashboardMetrics;
  riskTasks: DashboardTask[];
  tasks: DashboardTask[];
  timelineRange: {
    startDate: string;
    endDate: string;
    totalDays: number;
    todayPercent: number;
  };
}

function compareDate(left: string, right: string): number {
  return left.localeCompare(right);
}

export function getDashboardStatus(task: ProjectTask, today: string): DashboardTaskStatus {
  if (task.actualEndDate) return "finished";
  if (task.actualStartDate) return "in-progress";
  if (task.elapsedDays === "finished") return "finished";
  if (typeof task.elapsedDays === "number" && task.elapsedDays > 0) return "in-progress";
  if (compareDate(task.plannedStartDate, today) < 0) return "start-delayed";
  return "not-started";
}

function getStatusLabel(status: DashboardTaskStatus): string {
  const labels: Record<DashboardTaskStatus, string> = {
    finished: "已完成",
    "in-progress": "进行中",
    "start-delayed": "延迟启动",
    "not-started": "未开始",
  };
  return labels[status];
}

function getRiskLabel(task: ProjectTask, status: DashboardTaskStatus): string | undefined {
  if (task.warningState === "overdue") return `延期${task.overdueDays ?? 0}天`;
  if (task.warningState === "due-today") return "今日到期";
  if (task.warningState === "within-week") return "7日内到期";
  if (status === "start-delayed") return "延迟启动";
  return undefined;
}

function isRiskTask(task: ProjectTask, status: DashboardTaskStatus): boolean {
  return (
    task.warningState === "overdue" ||
    task.warningState === "due-today" ||
    task.warningState === "within-week" ||
    status === "start-delayed"
  );
}

function clampPercent(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

function buildTimeline(task: ProjectTask, rangeStart: string, totalDays: number) {
  const offsetDays = Math.max(calculateCalendarDays(rangeStart, task.plannedStartDate) - 1, 0);
  const durationDays = Math.max(task.plannedDurationDays, 1);
  return {
    leftPercent: clampPercent((offsetDays / totalDays) * 100),
    widthPercent: clampPercent((durationDays / totalDays) * 100),
  };
}

function buildTodayPercent(rangeStart: string, today: string, totalDays: number): number {
  const offsetDays = calculateCalendarDays(rangeStart, today) - 1;
  return clampPercent((offsetDays / totalDays) * 100);
}

export function buildDashboardModel({
  project,
  tasks,
  today,
}: {
  project: Project;
  tasks: ProjectTask[];
  today: string;
}): DashboardModel {
  const totalDays = Math.max(calculateCalendarDays(project.plannedStartDate, project.plannedEndDate), 1);
  const dashboardTasks = tasks.map((task) => {
    const dashboardStatus = getDashboardStatus(task, today);
    return {
      ...task,
      dashboardStatus,
      statusLabel: getStatusLabel(dashboardStatus),
      riskLabel: getRiskLabel(task, dashboardStatus),
      timeline: buildTimeline(task, project.plannedStartDate, totalDays),
    };
  });

  const metrics: DashboardMetrics = {
    totalTasks: dashboardTasks.length,
    finishedTasks: dashboardTasks.filter((task) => task.dashboardStatus === "finished").length,
    inProgressTasks: dashboardTasks.filter((task) => task.dashboardStatus === "in-progress").length,
    notStartedTasks: dashboardTasks.filter((task) => task.dashboardStatus === "not-started").length,
    startDelayedTasks: dashboardTasks.filter((task) => task.dashboardStatus === "start-delayed").length,
    overdueTasks: dashboardTasks.filter((task) => task.warningState === "overdue").length,
    dueTodayTasks: dashboardTasks.filter((task) => task.warningState === "due-today").length,
    withinWeekTasks: dashboardTasks.filter((task) => task.warningState === "within-week").length,
    overallProgress: dashboardTasks.length
      ? dashboardTasks.reduce((sum, task) => sum + task.completionRatio, 0) / dashboardTasks.length
      : 0,
  };

  return {
    project,
    today,
    metrics,
    riskTasks: dashboardTasks.filter((task) => isRiskTask(task, task.dashboardStatus)),
    tasks: dashboardTasks,
    timelineRange: {
      startDate: project.plannedStartDate,
      endDate: project.plannedEndDate,
      totalDays,
      todayPercent: buildTodayPercent(project.plannedStartDate, today, totalDays),
    },
  };
}
