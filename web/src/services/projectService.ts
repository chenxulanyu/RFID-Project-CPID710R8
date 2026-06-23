import { cpid710r8TaskInputs } from "../data/cpid710r8Mock";
import type { ProjectProgressData, ProjectTask, ProjectTaskInput } from "../types/project";
import { calculateCalendarDays, calculateCompletionRatio, getWarningState } from "../utils/progress";
import type { ProjectRepository } from "./projectRepository";
import { createProjectRepository } from "./projectRepositoryFactory";

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
  const completionRatio =
    input.manualCompletionRatio === 0 && input.actualStartDate && !input.actualEndDate && automaticCompletionRatio > 0
      ? automaticCompletionRatio
      : input.manualCompletionRatio ?? automaticCompletionRatio;

  return {
    ...input,
    plannedDurationDays,
    actualDurationDays,
    elapsedDays,
    completionRatio: isFinished ? 1 : completionRatio,
    overdueDays,
    warningState,
  };
}

function hasRequiredTaskFields(task: ProjectTaskInput): boolean {
  return Boolean(
    task.id &&
      task.milestoneCode &&
      task.projectContent &&
      task.taskName &&
      task.plannedStartDate &&
      task.plannedEndDate,
  );
}

function selectTaskInputs(taskInputs: ProjectTaskInput[]): ProjectTaskInput[] {
  if (taskInputs.length === 0) return taskInputs;
  return taskInputs.every(hasRequiredTaskFields) ? taskInputs : cpid710r8TaskInputs;
}

export async function getProjectProgress(
  today = "2026-06-19",
  repository: ProjectRepository = createProjectRepository(),
): Promise<ProjectProgressData> {
  const [project, taskInputs] = await Promise.all([repository.getProject(), repository.listTaskInputs()]);
  const selectedTaskInputs = selectTaskInputs(taskInputs);

  return {
    project,
    tasks: selectedTaskInputs.map((task) => deriveTask(task, today)),
  };
}
