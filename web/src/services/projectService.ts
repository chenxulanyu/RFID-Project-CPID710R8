import type { ProjectProgressData, ProjectTask, ProjectTaskInput } from "../types/project";
import { calculateCalendarDays, calculateCompletionRatio, getWarningState } from "../utils/progress";
import { DefaultProjectRepository, type ProjectRepository } from "./projectRepository";

function deriveTask(input: ProjectTaskInput, today: string): ProjectTask {
  const plannedDurationDays = calculateCalendarDays(input.plannedStartDate, input.plannedEndDate);
  const isFinished = Boolean(input.actualEndDate);
  const actualDurationDays =
    input.actualStartDate && input.actualEndDate
      ? calculateCalendarDays(input.actualStartDate, input.actualEndDate)
      : undefined;
  const elapsedDays = isFinished
    ? "finished"
    : input.actualStartDate
      ? calculateCalendarDays(input.actualStartDate, today)
      : "not-started";
  const numericElapsedDays = typeof elapsedDays === "number" ? elapsedDays : 0;
  const warningState = isFinished ? "none" : getWarningState({ today, plannedEndDate: input.plannedEndDate });
  const overdueDays =
    !isFinished && warningState === "overdue"
      ? Math.max(calculateCalendarDays(input.plannedEndDate, today) - 1, 0)
      : undefined;

  const automaticCompletionRatio = calculateCompletionRatio({
    plannedDurationDays,
    elapsedDays: numericElapsedDays,
    isFinished,
  });

  return {
    ...input,
    plannedDurationDays,
    actualDurationDays,
    elapsedDays,
    completionRatio: isFinished ? 1 : input.manualCompletionRatio ?? automaticCompletionRatio,
    overdueDays,
    warningState,
  };
}

export async function getProjectProgress(
  today = "2026-06-19",
  repository: ProjectRepository = new DefaultProjectRepository(),
): Promise<ProjectProgressData> {
  const [project, taskInputs] = await Promise.all([repository.getProject(), repository.listTaskInputs()]);

  return {
    project,
    tasks: taskInputs.map((task) => deriveTask(task, today)),
  };
}
