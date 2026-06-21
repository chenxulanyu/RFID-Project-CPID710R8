import type { Project, ProjectTask } from "../../types/project";
import { calculateCalendarDays } from "../../utils/progress";

export type DashboardTaskStatus = "finished" | "in-progress" | "not-started";

export interface DashboardTask extends ProjectTask {
  dashboardStatus: DashboardTaskStatus;
  statusLabel: string;
  riskLabel?: string;
  timeline: {
    plan: { leftPercent: number; widthPercent: number };
    actual?: { leftPercent: number; widthPercent: number };
    percent: number;
  };
}

export interface DashboardMetrics {
  totalTasks: number;
  totalDetailTasks: number;
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

function hasDelayedActualStart(task: ProjectTask): boolean {
  return Boolean(task.actualStartDate && compareDate(task.actualStartDate, task.plannedStartDate) > 0);
}
export function getStartDeviationLabel(task: ProjectTask): string | undefined {
  if (!task.actualStartDate) return undefined;
  const cmp = compareDate(task.actualStartDate, task.plannedStartDate);
  if (cmp > 0) return "延迟启动";
  if (cmp < 0) return "提前启动";
  return undefined;
}
export function getCompletionDeviationLabel(task: ProjectTask): string | undefined {
  if (!task.actualEndDate) return undefined;
  const cmp = compareDate(task.actualEndDate, task.plannedEndDate);
  if (cmp > 0) return `超期${calculateCalendarDays(task.plannedEndDate, task.actualEndDate) - 1}天`;
  if (cmp < 0) return `提前${calculateCalendarDays(task.actualEndDate, task.plannedEndDate) - 1}天`;
  return undefined;
}

export function getDashboardStatus(task: ProjectTask, today: string): DashboardTaskStatus {
  void today;
  if (task.actualEndDate) return "finished";
  if (task.actualStartDate) return "in-progress";
  return "not-started";
}

function getStatusLabel(status: DashboardTaskStatus): string {
  const labels: Record<DashboardTaskStatus, string> = {
    finished: "已完成",
    "in-progress": "进行中",
    "not-started": "未开始",
  };
  return labels[status];
}

function getRiskLabel(task: ProjectTask): string | undefined {
  if (task.warningState === "overdue") return `延期${task.overdueDays ?? 0}天`;
  if (task.warningState === "due-today") return "今日到期";
  if (task.warningState === "within-week") return "7日内到期";
  if (hasDelayedActualStart(task)) return "延迟启动";
  return undefined;
}

function isRiskTask(task: ProjectTask): boolean {
  return (
    task.warningState === "overdue" ||
    task.warningState === "due-today" ||
    task.warningState === "within-week" ||
    hasDelayedActualStart(task)
  );
}

function clampPercent(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

function buildTimeline(task: ProjectTask, rangeStart: string, totalDays: number) {
  const planLeft = clampPercent(((calculateCalendarDays(rangeStart, task.plannedStartDate) - 1) / totalDays) * 100);
  const planWidth = clampPercent((Math.max(task.plannedDurationDays, 1) / totalDays) * 100);
  const percent = clampPercent(Math.round(task.completionRatio * 100));

  const actualObj = task.actualStartDate && task.actualEndDate
    ? {
        leftPercent: clampPercent(((calculateCalendarDays(rangeStart, task.actualStartDate!) - 1) / totalDays) * 100),
        widthPercent: clampPercent((Math.max(calculateCalendarDays(task.actualStartDate!, task.actualEndDate!), 1) / totalDays) * 100),
      }
    : undefined;

  return { plan: { leftPercent: planLeft, widthPercent: planWidth }, actual: actualObj, percent };
}

function buildTodayPercent(rangeStart: string, today: string, totalDays: number): number {
  const offsetDays = calculateCalendarDays(rangeStart, today) - 1;
  return clampPercent((offsetDays / totalDays) * 100);
}

function countUniqueMilestones(tasks: ProjectTask[]): number {
  return new Set(tasks.map((task) => task.milestoneCode)).size;
}

function computeTimelineRange(project: Project, tasks: ProjectTask[]) {
  if (tasks.length === 0) {
    return {
      startDate: project.plannedStartDate,
      endDate: project.plannedEndDate,
      totalDays: Math.max(calculateCalendarDays(project.plannedStartDate, project.plannedEndDate), 1),
    };
  }
  const taskStartDates = tasks.map((t) => t.plannedStartDate).filter(Boolean).sort();
  const taskEndDates = tasks.map((t) => t.plannedEndDate).filter(Boolean).sort();
  const earliestTaskStart = taskStartDates.length > 0 ? taskStartDates[0] : project.plannedStartDate;
  const latestTaskEnd = taskEndDates.length > 0 ? taskEndDates[taskEndDates.length - 1] : project.plannedEndDate;
  const startDate = project.plannedStartDate < earliestTaskStart ? project.plannedStartDate : earliestTaskStart;
  const endDate = project.plannedEndDate > latestTaskEnd ? project.plannedEndDate : latestTaskEnd;
  const totalDays = Math.max(calculateCalendarDays(startDate, endDate), 1);
  return { startDate, endDate, totalDays };
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
  const { startDate: rangeStart, endDate: rangeEnd, totalDays } = computeTimelineRange(project, tasks);
  const dashboardTasks = tasks.map((task) => {
    const dashboardStatus = getDashboardStatus(task, today);
    return {
      ...task,
      dashboardStatus,
      statusLabel: getStatusLabel(dashboardStatus),
      riskLabel: getRiskLabel(task),
      timeline: buildTimeline(task, rangeStart, totalDays),
    };
  });

  const metrics: DashboardMetrics = {
    totalTasks: countUniqueMilestones(dashboardTasks),
    totalDetailTasks: dashboardTasks.length,
    finishedTasks: dashboardTasks.filter((task) => task.dashboardStatus === "finished").length,
    inProgressTasks: dashboardTasks.filter((task) => task.dashboardStatus === "in-progress").length,
    notStartedTasks: dashboardTasks.filter((task) => task.dashboardStatus === "not-started").length,
    startDelayedTasks: dashboardTasks.filter(hasDelayedActualStart).length,
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
    riskTasks: dashboardTasks.filter(isRiskTask),
    tasks: dashboardTasks,
    timelineRange: {
      startDate: rangeStart,
      endDate: rangeEnd,
      totalDays,
      todayPercent: buildTodayPercent(rangeStart, today, totalDays),
    },
  };
}
