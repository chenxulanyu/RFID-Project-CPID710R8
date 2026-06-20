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
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function firstDocument(data: CloudBaseDocument | CloudBaseDocument[] | null): CloudBaseDocument | null {
  return Array.isArray(data) ? data[0] ?? null : data;
}

export function projectToCloudBaseDocument(project: Project): CloudBaseDocument {
  return { _id: project.id, ...project, updatedAt: new Date().toISOString() };
}

export function projectFromCloudBaseDocument(document: CloudBaseDocument): Project {
  return {
    id: String(document._id ?? document.id),
    name: String(document.name),
    plannedStartDate: String(document.plannedStartDate),
    plannedEndDate: String(document.plannedEndDate),
    calendarMode: document.calendarMode === "workdays" ? "workdays" : "calendar-days",
  };
}

export function taskToCloudBaseDocument(task: ProjectTaskInput, projectId: string): CloudBaseDocument {
  return { _id: task.id, projectId, ...task, updatedAt: new Date().toISOString() };
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

  async getProject(): Promise<Project> {
    const response = await this.database.collection(this.projectsCollection).doc(this.projectId).get();
    const document = firstDocument(response.data);
    if (!document) throw new Error(`CloudBase project not found: ${this.projectId}`);
    return projectFromCloudBaseDocument(document);
  }

  async saveProject(project: Project): Promise<Project> {
    await this.database.collection(this.projectsCollection).doc(project.id).set(projectToCloudBaseDocument(project));
    return project;
  }

  async listTaskInputs(options: ListTaskOptions = {}): Promise<ProjectTaskInput[]> {
    const response = await this.database.collection(this.tasksCollection).where({ projectId: this.projectId }).get();
    return response.data
      .map(taskFromCloudBaseDocument)
      .filter((task) => options.includeArchived || !task.isArchived);
  }

  async saveTaskInput(task: ProjectTaskInput): Promise<ProjectTaskInput> {
    await this.database.collection(this.tasksCollection).doc(task.id).set(taskToCloudBaseDocument(task, this.projectId));
    return { ...task };
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
