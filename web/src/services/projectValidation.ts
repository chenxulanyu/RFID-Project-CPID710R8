import type { Project, ProjectTaskInput } from "../types/project";

export class ProjectValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "ProjectValidationError";
  }
}

function requireText(value: string | undefined, field: string, label: string) {
  if (!value || !value.trim()) {
    throw new ProjectValidationError(`${label}不能为空`, field);
  }
}

function assertDateOrder(start: string | undefined, end: string | undefined, field: string, label: string) {
  if (start && end && end.localeCompare(start) < 0) {
    throw new ProjectValidationError(`${label}结束日期不能早于开始日期`, field);
  }
}

export function validateProject(project: Project): void {
  requireText(project.id, "id", "项目 ID");
  requireText(project.name, "name", "项目名称");
  requireText(project.plannedStartDate, "plannedStartDate", "项目计划开始日期");
  requireText(project.plannedEndDate, "plannedEndDate", "项目计划结束日期");
  assertDateOrder(project.plannedStartDate, project.plannedEndDate, "plannedEndDate", "项目计划");
}

export function validateTaskInput(task: ProjectTaskInput): void {
  requireText(task.id, "id", "任务 ID");
  requireText(task.milestoneCode, "milestoneCode", "里程碑");
  requireText(task.taskName, "taskName", "任务名称");
  requireText(task.plannedStartDate, "plannedStartDate", "计划开始日期");
  requireText(task.plannedEndDate, "plannedEndDate", "计划结束日期");
  requireText(task.resourceOwner, "resourceOwner", "资源方");
  requireText(task.responsiblePerson, "responsiblePerson", "责任人");
  assertDateOrder(task.plannedStartDate, task.plannedEndDate, "plannedEndDate", "计划");
  assertDateOrder(task.actualStartDate, task.actualEndDate, "actualEndDate", "实际");
  if (
    task.manualCompletionRatio !== undefined &&
    (Number.isNaN(task.manualCompletionRatio) || task.manualCompletionRatio < 0 || task.manualCompletionRatio > 1)
  ) {
    throw new ProjectValidationError("完成比例必须在 0 到 100% 之间", "manualCompletionRatio");
  }
}
