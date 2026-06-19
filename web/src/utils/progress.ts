import type { WarningState } from "../types/project";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function calculateCalendarDays(startDate: string, endDate: string): number {
  return Math.floor((toUtcDate(endDate).getTime() - toUtcDate(startDate).getTime()) / MS_PER_DAY) + 1;
}

export function calculateCompletionRatio({
  plannedDurationDays,
  elapsedDays,
  isFinished,
}: {
  plannedDurationDays: number;
  elapsedDays: number;
  isFinished: boolean;
}): number {
  if (isFinished) return 1;
  if (plannedDurationDays <= 0 || elapsedDays <= 0) return 0;
  if (elapsedDays >= plannedDurationDays) return 0.99;
  return Math.min(elapsedDays / plannedDurationDays, 1);
}

export function getWarningState({
  today,
  plannedEndDate,
}: {
  today: string;
  plannedEndDate: string;
}): WarningState {
  const diff = Math.floor((toUtcDate(plannedEndDate).getTime() - toUtcDate(today).getTime()) / MS_PER_DAY);
  if (diff < 0) return "overdue";
  if (diff === 0) return "due-today";
  if (diff <= 7) return "within-week";
  return "future";
}
