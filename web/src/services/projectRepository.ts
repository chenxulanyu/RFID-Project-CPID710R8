import { cpid710r8Project, cpid710r8TaskInputs } from "../data/cpid710r8Mock";
import type { Project, ProjectTaskInput } from "../types/project";

export interface ProjectDataSnapshot {
  project: Project;
  tasks: ProjectTaskInput[];
}

export interface ListTaskOptions {
  includeArchived?: boolean;
}

export interface ProjectRepository {
  getProject(): Promise<Project>;
  saveProject(project: Project): Promise<Project>;
  listTaskInputs(options?: ListTaskOptions): Promise<ProjectTaskInput[]>;
  saveTaskInput(task: ProjectTaskInput): Promise<ProjectTaskInput>;
  archiveTask(taskId: string, archivedAt: string): Promise<ProjectTaskInput>;
  restoreTask(taskId: string): Promise<ProjectTaskInput>;
}

const initialSnapshot: ProjectDataSnapshot = {
  project: cpid710r8Project,
  tasks: cpid710r8TaskInputs,
};

function cloneSnapshot(snapshot: ProjectDataSnapshot): ProjectDataSnapshot {
  return {
    project: { ...snapshot.project },
    tasks: snapshot.tasks.map((task) => ({ ...task })),
  };
}

export class LocalProjectRepository implements ProjectRepository {
  private snapshot: ProjectDataSnapshot;

  constructor(snapshot: ProjectDataSnapshot = initialSnapshot) {
    this.snapshot = cloneSnapshot(snapshot);
  }

  static fromSnapshot(snapshot: ProjectDataSnapshot): LocalProjectRepository {
    return new LocalProjectRepository(snapshot);
  }

  async getProject(): Promise<Project> {
    return { ...this.snapshot.project };
  }

  async saveProject(project: Project): Promise<Project> {
    this.snapshot = { ...this.snapshot, project: { ...project } };
    return this.getProject();
  }

  async listTaskInputs(options: ListTaskOptions = {}): Promise<ProjectTaskInput[]> {
    const tasks = options.includeArchived
      ? this.snapshot.tasks
      : this.snapshot.tasks.filter((task) => !task.isArchived);
    return tasks.map((task) => ({ ...task }));
  }

  async saveTaskInput(task: ProjectTaskInput): Promise<ProjectTaskInput> {
    const nextTask = { ...task };
    const existingIndex = this.snapshot.tasks.findIndex((item) => item.id === task.id);
    const nextTasks =
      existingIndex >= 0
        ? this.snapshot.tasks.map((item, index) => (index === existingIndex ? nextTask : item))
        : [...this.snapshot.tasks, nextTask];
    this.snapshot = { ...this.snapshot, tasks: nextTasks };
    return { ...nextTask };
  }

  async archiveTask(taskId: string, archivedAt: string): Promise<ProjectTaskInput> {
    const task = this.snapshot.tasks.find((item) => item.id === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    return this.saveTaskInput({ ...task, isArchived: true, archivedAt });
  }

  async restoreTask(taskId: string): Promise<ProjectTaskInput> {
    const task = this.snapshot.tasks.find((item) => item.id === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    const { archivedAt: _archivedAt, ...restored } = task;
    return this.saveTaskInput({ ...restored, isArchived: false });
  }
}

export class MockProjectRepository extends LocalProjectRepository {}
