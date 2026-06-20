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
  deleteTask(taskId: string): Promise<void>;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface LocalProjectRepositoryOptions {
  initialSnapshot?: ProjectDataSnapshot;
  storage?: StorageAdapter | null;
  storageKey?: string;
}

const initialSnapshot: ProjectDataSnapshot = {
  project: cpid710r8Project,
  tasks: cpid710r8TaskInputs,
};

const defaultStorageKey = "cpid710r8-project-progress";

function cloneSnapshot(snapshot: ProjectDataSnapshot): ProjectDataSnapshot {
  return {
    project: { ...snapshot.project },
    tasks: snapshot.tasks.map((task) => ({ ...task })),
  };
}

function mergeTaskInputs(seedTasks: ProjectTaskInput[], overrideTasks: ProjectTaskInput[]): ProjectTaskInput[] {
  const overridesById = new Map(overrideTasks.map((task) => [task.id, task]));
  const mergedSeedTasks = seedTasks.map((task) => ({ ...task, ...overridesById.get(task.id) }));
  const seedIds = new Set(seedTasks.map((task) => task.id));
  const customTasks = overrideTasks.filter((task) => !seedIds.has(task.id));
  return [...mergedSeedTasks, ...customTasks];
}

function isLegacySeedSnapshot(snapshot: ProjectDataSnapshot, fallbackSnapshot: ProjectDataSnapshot): boolean {
  const fallbackMilestones = new Set(fallbackSnapshot.tasks.map((task) => task.milestoneCode));
  const snapshotMilestones = new Set(snapshot.tasks.map((task) => task.milestoneCode));
  return (
    snapshot.project.id === fallbackSnapshot.project.id &&
    fallbackMilestones.size >= 20 &&
    snapshotMilestones.size < fallbackMilestones.size &&
    snapshot.tasks.every((task) => fallbackSnapshot.tasks.some((seedTask) => seedTask.id === task.id))
  );
}

function upgradeStoredSnapshot(
  storedSnapshot: ProjectDataSnapshot | null,
  fallbackSnapshot: ProjectDataSnapshot,
): ProjectDataSnapshot | null {
  if (!storedSnapshot) return null;
  if (!isLegacySeedSnapshot(storedSnapshot, fallbackSnapshot)) return storedSnapshot;
  return {
    project: { ...fallbackSnapshot.project, ...storedSnapshot.project },
    tasks: mergeTaskInputs(fallbackSnapshot.tasks, storedSnapshot.tasks),
  };
}

function isSnapshot(input: ProjectDataSnapshot | LocalProjectRepositoryOptions): input is ProjectDataSnapshot {
  return "project" in input && "tasks" in input;
}

function getBrowserStorage(): StorageAdapter | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function readStoredSnapshot(storage: StorageAdapter, storageKey: string): ProjectDataSnapshot | null {
  const raw = storage.getItem(storageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ProjectDataSnapshot;
    if (!parsed.project || !Array.isArray(parsed.tasks)) return null;
    return cloneSnapshot(parsed);
  } catch {
    return null;
  }
}

export class LocalProjectRepository implements ProjectRepository {
  private snapshot: ProjectDataSnapshot;
  private readonly storage: StorageAdapter | null;
  private readonly storageKey: string;

  constructor(input: ProjectDataSnapshot | LocalProjectRepositoryOptions = {}) {
    const options = isSnapshot(input) ? { initialSnapshot: input, storage: null } : input;
    this.storage = options.storage === undefined ? getBrowserStorage() : options.storage;
    this.storageKey = options.storageKey ?? defaultStorageKey;
    const fallbackSnapshot = options.initialSnapshot ?? initialSnapshot;
    const storedSnapshot = this.storage ? readStoredSnapshot(this.storage, this.storageKey) : null;
    this.snapshot = cloneSnapshot(upgradeStoredSnapshot(storedSnapshot, initialSnapshot) ?? storedSnapshot ?? fallbackSnapshot);
  }

  static fromSnapshot(snapshot: ProjectDataSnapshot): LocalProjectRepository {
    return new LocalProjectRepository({ initialSnapshot: snapshot, storage: null });
  }

  private persistSnapshot() {
    this.storage?.setItem(this.storageKey, JSON.stringify(this.snapshot));
  }

  async getProject(): Promise<Project> {
    return { ...this.snapshot.project };
  }

  async saveProject(project: Project): Promise<Project> {
    this.snapshot = { ...this.snapshot, project: { ...project } };
    this.persistSnapshot();
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
    this.persistSnapshot();
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

  async deleteTask(taskId: string): Promise<void> {
    const task = this.snapshot.tasks.find((item) => item.id === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    this.snapshot = { ...this.snapshot, tasks: this.snapshot.tasks.filter((item) => item.id !== taskId) };
    this.persistSnapshot();
  }
}

export class DefaultProjectRepository extends LocalProjectRepository {}
