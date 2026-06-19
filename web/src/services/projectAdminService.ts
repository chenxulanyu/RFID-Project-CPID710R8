import type { Project, ProjectTaskInput } from "../types/project";
import type { ProjectRepository } from "./projectRepository";
import { ProjectValidationError, validateProject, validateTaskInput } from "./projectValidation";

export async function getAdminProjectData(repository: ProjectRepository) {
  const [project, tasks] = await Promise.all([
    repository.getProject(),
    repository.listTaskInputs({ includeArchived: true }),
  ]);
  return { project, tasks };
}

export async function saveProjectMetadata(repository: ProjectRepository, project: Project): Promise<Project> {
  validateProject(project);
  return repository.saveProject(project);
}

export async function createProjectTask(
  repository: ProjectRepository,
  task: ProjectTaskInput,
): Promise<ProjectTaskInput> {
  validateTaskInput(task);
  const existingTasks = await repository.listTaskInputs({ includeArchived: true });
  if (existingTasks.some((item) => item.id === task.id)) {
    throw new ProjectValidationError("任务 ID 已存在", "id");
  }
  return repository.saveTaskInput({ ...task, isArchived: false, archivedAt: undefined });
}

export async function updateProjectTask(
  repository: ProjectRepository,
  task: ProjectTaskInput,
): Promise<ProjectTaskInput> {
  validateTaskInput(task);
  return repository.saveTaskInput(task);
}

export async function archiveProjectTask(
  repository: ProjectRepository,
  taskId: string,
  archivedAt: string,
): Promise<ProjectTaskInput> {
  return repository.archiveTask(taskId, archivedAt);
}

export async function restoreProjectTask(repository: ProjectRepository, taskId: string): Promise<ProjectTaskInput> {
  return repository.restoreTask(taskId);
}
