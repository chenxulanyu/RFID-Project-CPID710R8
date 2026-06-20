import { cpid710r8Project, cpid710r8TaskInputs } from "../data/cpid710r8Mock";
import type { Project, ProjectTaskInput } from "../types/project";
import type { ListTaskOptions, ProjectRepository } from "./projectRepository";

type CloudBaseDocument = Record<string, unknown>;

export interface CloudBaseDocumentReferenceLike {
  get(): Promise<{ data: CloudBaseDocument | CloudBaseDocument[] | null }>;
  set(document: CloudBaseDocument): Promise<unknown>;
  update(patch: CloudBaseDocument): Promise<unknown>;
}

export interface CloudBaseQueryLike {
  get(): Promise<{ data: CloudBaseDocument[] }>;
}

export interface CloudBaseCollectionLike {
  doc(id: string): CloudBaseDocumentReferenceLike;
  where(query: CloudBaseDocument): CloudBaseQueryLike;
}

export interface CloudBaseDatabaseLike {
  collection(name: string): CloudBaseCollectionLike;
}

export interface CloudBaseProjectRepositoryOptions {
  database: CloudBaseDatabaseLike;
  projectId: string;
  projectsCollection?: string;
  tasksCollection?: string;
}

const defaultProjectsCollection = "projects";
const defaultTasksCollection = "project_tasks";

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 && value !== "undefined" && value !== "null" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeProjectForComparison(project: Project): Pick<Project, "id" | "name" | "plannedStartDate" | "plannedEndDate" | "calendarMode"> {
  return {
    id: project.id,
    name: project.name,
    plannedStartDate: project.plannedStartDate,
    plannedEndDate: project.plannedEndDate,
    calendarMode: project.calendarMode,
  };
}

function projectMatchesExpected(left: Project, right: Project): boolean {
  const expected = normalizeProjectForComparison(left);
  const actual = normalizeProjectForComparison(right);
  return (
    actual.id === expected.id &&
    actual.name === expected.name &&
    actual.plannedStartDate === expected.plannedStartDate &&
    actual.plannedEndDate === expected.plannedEndDate &&
    actual.calendarMode === expected.calendarMode
  );
}

function requiredString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 && value !== "undefined" && value !== "null" ? value : fallback;
}

function firstDocument(data: CloudBaseDocument | CloudBaseDocument[] | null): CloudBaseDocument | null {
  return Array.isArray(data) ? data[0] ?? null : data;
}

function hasRequiredTaskDocumentFields(document: CloudBaseDocument): boolean {
  return Boolean(
    optionalString(document._id ?? document.id) &&
      optionalString(document.milestoneCode) &&
      optionalString(document.projectContent) &&
      optionalString(document.taskName) &&
      optionalString(document.plannedStartDate) &&
      optionalString(document.plannedEndDate) &&
      optionalString(document.resourceOwner) &&
      optionalString(document.responsiblePerson),
  );
}

function mergeTaskInputs(seedTasks: ProjectTaskInput[], cloudTasks: ProjectTaskInput[]): ProjectTaskInput[] {
  const cloudTasksById = new Map(cloudTasks.map((task) => [task.id, task]));
  const mergedSeedTasks = seedTasks.map((task) => ({ ...task, ...cloudTasksById.get(task.id) }));
  const seedIds = new Set(seedTasks.map((task) => task.id));
  const customCloudTasks = cloudTasks.filter((task) => !seedIds.has(task.id));
  return [...mergedSeedTasks, ...customCloudTasks];
}

export function projectToCloudBaseDocument(project: Project): CloudBaseDocument {
  return { ...project, updatedAt: new Date().toISOString() };
}

export function projectFromCloudBaseDocument(document: CloudBaseDocument): Project {
  return {
    id: requiredString(document._id ?? document.id, cpid710r8Project.id),
    name: requiredString(document.name, cpid710r8Project.name),
    plannedStartDate: requiredString(document.plannedStartDate, "2026-03-30"),
    plannedEndDate: requiredString(document.plannedEndDate, "2026-09-28"),
    calendarMode: document.calendarMode === "workdays" ? "workdays" : "calendar-days",
  };
}

export function taskToCloudBaseDocument(task: ProjectTaskInput, projectId: string): CloudBaseDocument {
  const { id, ...rest } = task;
  return {
    ...rest,
    archivedAt: task.archivedAt ?? null,
    id,
    projectId,
    updatedAt: new Date().toISOString(),
  };
}

export function taskFromCloudBaseDocument(document: CloudBaseDocument): ProjectTaskInput {
  return {
    id: String(document._id ?? document.id),
    milestoneCode: String(document.milestoneCode),
    projectContent: String(document.projectContent),
    taskName: String(document.taskName),
    plannedStartDate: String(document.plannedStartDate),
    plannedEndDate: String(document.plannedEndDate),
    actualStartDate: optionalString(document.actualStartDate),
    actualEndDate: optionalString(document.actualEndDate),
    resourceOwner: String(document.resourceOwner),
    responsiblePerson: String(document.responsiblePerson),
    remarks: optionalString(document.remarks),
    manualCompletionRatio: optionalNumber(document.manualCompletionRatio),
    isArchived: optionalBoolean(document.isArchived),
    archivedAt: optionalString(document.archivedAt),
  };
}

export class CloudBaseProjectRepository implements ProjectRepository {
  private readonly database: CloudBaseDatabaseLike;
  private readonly projectId: string;
  private readonly projectsCollection: string;
  private readonly tasksCollection: string;

  constructor(options: CloudBaseProjectRepositoryOptions) {
    this.database = options.database;
    this.projectId = options.projectId;
    this.projectsCollection = options.projectsCollection ?? defaultProjectsCollection;
    this.tasksCollection = options.tasksCollection ?? defaultTasksCollection;
  }

  private async assertWriteSucceeded(result: unknown): Promise<void> {
    if (result && typeof result === "object" && "code" in result && typeof (result as { code?: unknown }).code === "string") {
      const errorResult = result as { code?: unknown; message?: unknown };
      const message = typeof errorResult.message === "string" ? errorResult.message : "CloudBase写入失败";
      throw new Error(`CloudBase保存失败：${message}`);
    }
  }

  private async saveDocument(collectionName: string, id: string, document: CloudBaseDocument): Promise<void> {
    const collection = this.database.collection(collectionName);
    const reference = collection.doc(id);
    const existing = await reference.get();
    const currentDocument = firstDocument(existing.data);
    if (currentDocument) {
      await this.assertWriteSucceeded(await reference.update(document));
      return;
    }
    await this.assertWriteSucceeded(await reference.set(document));
  }

  async getProject(): Promise<Project> {
    const response = await this.database.collection(this.projectsCollection).doc(this.projectId).get();
    const document = firstDocument(response.data);
    if (!document) throw new Error(`CloudBase project not found: ${this.projectId}`);
    return projectFromCloudBaseDocument(document);
  }

  async saveProject(project: Project): Promise<Project> {
    const reference = this.database.collection(this.projectsCollection).doc(project.id);
    await this.saveDocument(this.projectsCollection, project.id, projectToCloudBaseDocument(project));
    const readBackProject = async () => {
      const saved = await reference.get();
      const document = firstDocument(saved.data);
      if (!document) throw new Error(`CloudBase project not found after save: ${project.id}`);
      return projectFromCloudBaseDocument(document);
    };

    const firstRead = await readBackProject();
    if (projectMatchesExpected(project, firstRead)) {
      return firstRead;
    }

    const secondRead = await readBackProject();
    if (projectMatchesExpected(project, secondRead)) {
      return secondRead;
    }

    throw new Error("CloudBase保存失败：项目回读结果与提交内容不一致");
  }

  async listTaskInputs(options: ListTaskOptions = {}): Promise<ProjectTaskInput[]> {
    const response = await this.database.collection(this.tasksCollection).where({ projectId: this.projectId }).get();
    const cloudTasks = response.data
      .filter(hasRequiredTaskDocumentFields)
      .map(taskFromCloudBaseDocument);
    return mergeTaskInputs(cpid710r8TaskInputs, cloudTasks)
      .filter((task) => options.includeArchived || !task.isArchived);
  }

  async saveTaskInput(task: ProjectTaskInput): Promise<ProjectTaskInput> {
    const reference = this.database.collection(this.tasksCollection).doc(task.id);
    await this.saveDocument(this.tasksCollection, task.id, taskToCloudBaseDocument(task, this.projectId));
    const saved = await reference.get();
    const document = firstDocument(saved.data);
    if (!document) throw new Error(`Task not found after save: ${task.id}`);
    const persisted = taskFromCloudBaseDocument(document);
    if (
      persisted.id !== task.id ||
      persisted.milestoneCode !== task.milestoneCode ||
      persisted.projectContent !== task.projectContent ||
      persisted.taskName !== task.taskName ||
      persisted.plannedStartDate !== task.plannedStartDate ||
      persisted.plannedEndDate !== task.plannedEndDate ||
      persisted.actualStartDate !== task.actualStartDate ||
      persisted.actualEndDate !== task.actualEndDate ||
      persisted.resourceOwner !== task.resourceOwner ||
      persisted.responsiblePerson !== task.responsiblePerson ||
      persisted.remarks !== task.remarks ||
      persisted.manualCompletionRatio !== task.manualCompletionRatio ||
      persisted.isArchived !== task.isArchived ||
      persisted.archivedAt !== task.archivedAt
    ) {
      throw new Error("CloudBase保存失败：任务回读结果与提交内容不一致");
    }
    return persisted;
  }

  async archiveTask(taskId: string, archivedAt: string): Promise<ProjectTaskInput> {
    const task = (await this.listTaskInputs({ includeArchived: true })).find((item) => item.id === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    return this.saveTaskInput({ ...task, isArchived: true, archivedAt });
  }

  async restoreTask(taskId: string): Promise<ProjectTaskInput> {
    const task = (await this.listTaskInputs({ includeArchived: true })).find((item) => item.id === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    const { archivedAt: _archivedAt, ...restored } = task;
    return this.saveTaskInput({ ...restored, isArchived: false });
  }
}
