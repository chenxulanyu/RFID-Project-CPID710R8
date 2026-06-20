import { describe, expect, it } from "vitest";
import type { Project, ProjectTaskInput } from "../types/project";
import {
  CloudBaseProjectRepository,
  type CloudBaseCollectionLike,
  type CloudBaseDatabaseLike,
  type CloudBaseDocumentReferenceLike,
  type CloudBaseQueryLike,
  projectFromCloudBaseDocument,
  projectToCloudBaseDocument,
  taskFromCloudBaseDocument,
  taskToCloudBaseDocument,
} from "./cloudbaseProjectRepository";

const project: Project = {
  id: "cpid710r8",
  name: "CPID710R8 项目",
  plannedStartDate: "2026-03-30",
  plannedEndDate: "2026-09-28",
  calendarMode: "calendar-days",
};

function task(overrides: Partial<ProjectTaskInput> & Pick<ProjectTaskInput, "id" | "taskName">): ProjectTaskInput {
  return {
    id: overrides.id,
    milestoneCode: overrides.milestoneCode ?? "M1",
    projectContent: overrides.projectContent ?? "开发内容",
    taskName: overrides.taskName,
    plannedStartDate: overrides.plannedStartDate ?? "2026-06-01",
    plannedEndDate: overrides.plannedEndDate ?? "2026-06-10",
    actualStartDate: overrides.actualStartDate,
    actualEndDate: overrides.actualEndDate,
    resourceOwner: overrides.resourceOwner ?? "芯联",
    responsiblePerson: overrides.responsiblePerson ?? "负责人",
    remarks: overrides.remarks,
    manualCompletionRatio: overrides.manualCompletionRatio,
    isArchived: overrides.isArchived,
    archivedAt: overrides.archivedAt,
  };
}

class FakeCollection {
  constructor(
    private readonly documents: Map<string, Record<string, unknown>>,
    private readonly docGetMode: "object" | "array" = "object",
  ) {}

  doc(id: string) {
    return {
      get: async () => {
        const document = this.documents.get(id);
        if (!document) return { data: null };
        return { data: this.docGetMode === "array" ? [{ ...document }] : { ...document } };
      },
      set: async (document: Record<string, unknown>) => {
        this.documents.set(id, { ...document, _id: id });
        return { id };
      },
      update: async (patch: Record<string, unknown>) => {
        const current = this.documents.get(id);
        if (!current) throw new Error(`Missing document: ${id}`);
        this.documents.set(id, { ...current, ...patch, _id: id });
        return { updated: 1 };
      },
    };
  }

  where(query: Record<string, unknown>) {
    return {
      get: async () => ({
        data: [...this.documents.values()]
          .filter((document) => Object.entries(query).every(([key, value]) => document[key] === value))
          .map((document) => ({ ...document })),
      }),
    };
  }
}

class FakeDatabase implements CloudBaseDatabaseLike {
  readonly collections = new Map<string, Map<string, Record<string, unknown>>>();

  constructor(private readonly docGetMode: "object" | "array" = "object") {}

  collection(name: string) {
    if (!this.collections.has(name)) this.collections.set(name, new Map());
    return new FakeCollection(this.collections.get(name)!, this.docGetMode);
  }
}

describe("CloudBase project document mapping", () => {
  it("round-trips project fields without service-side secrets", () => {
    const document = projectToCloudBaseDocument(project);
    expect(document).toMatchObject({
      id: "cpid710r8",
      name: "CPID710R8 项目",
      calendarMode: "calendar-days",
    });
    expect(document).not.toHaveProperty("secretId");
    expect(document).not.toHaveProperty("secretKey");
    expect(projectFromCloudBaseDocument(document)).toEqual(project);
  });

  it("round-trips task fields including archive and manual progress", () => {
    const input = task({
      id: "task-1",
      taskName: "任务 1",
      actualStartDate: "2026-06-02",
      manualCompletionRatio: 0.45,
      isArchived: true,
      archivedAt: "2026-06-19",
    });
    const document = taskToCloudBaseDocument(input, "cpid710r8");
    expect(document).toMatchObject({ id: "task-1", projectId: "cpid710r8", manualCompletionRatio: 0.45 });
    expect(taskFromCloudBaseDocument({ _id: input.id, ...document })).toEqual(input);
  });
});

describe("CloudBaseProjectRepository reads", () => {
  it("reads project metadata and filters archived tasks by default", async () => {
    const database = new FakeDatabase();
    database.collections.set("projects", new Map([["cpid710r8", projectToCloudBaseDocument(project)]]));
    database.collections.set(
      "project_tasks",
      new Map([
        ["active", taskToCloudBaseDocument(task({ id: "active", taskName: "活跃任务" }), "cpid710r8")],
        [
          "archived",
          taskToCloudBaseDocument(
            task({ id: "archived", taskName: "归档任务", isArchived: true, archivedAt: "2026-06-19" }),
            "cpid710r8",
          ),
        ],
      ]),
    );
    const repository = new CloudBaseProjectRepository({ database, projectId: "cpid710r8" });

    expect(await repository.getProject()).toEqual(project);
    expect((await repository.listTaskInputs()).map((item) => item.id)).toContain("active");
    expect((await repository.listTaskInputs({ includeArchived: true })).map((item) => item.id)).toEqual(
      expect.arrayContaining(["active", "archived"]),
    );
  });

  it("merges CloudBase task overrides onto the complete default seed", async () => {
    const database = new FakeDatabase();
    database.collections.set(
      "project_tasks",
      new Map([
        [
          "legacy-invalid",
          {
            _id: "legacy-invalid",
            projectId: "cpid710r8",
            name: "旧占位数据",
            status: "active",
          },
        ],
        [
          "M5-002",
          taskToCloudBaseDocument(
            task({
              id: "M5-002",
              milestoneCode: "M5",
              projectContent: "V1.0 PCBA打样",
              taskName: "跨设备更新后的任务",
              manualCompletionRatio: 0.75,
            }),
            "cpid710r8",
          ),
        ],
      ]),
    );
    const repository = new CloudBaseProjectRepository({ database, projectId: "cpid710r8" });

    const tasks = await repository.listTaskInputs();

    expect(tasks).toHaveLength(31);
    expect(new Set(tasks.map((item) => item.milestoneCode)).size).toBe(20);
    expect(tasks.find((item) => item.id === "M5-002")).toMatchObject({
      taskName: "跨设备更新后的任务",
      manualCompletionRatio: 0.75,
    });
    expect(tasks.some((item) => item.id === "legacy-invalid")).toBe(false);
  });

  it("reads project metadata from CloudBase doc get array responses", async () => {
    const database = new FakeDatabase("array");
    database.collections.set("projects", new Map([["cpid710r8", projectToCloudBaseDocument(project)]]));
    const repository = new CloudBaseProjectRepository({ database, projectId: "cpid710r8" });

    expect(await repository.getProject()).toEqual(project);
  });

  it("falls back to seeded project dates when the CloudBase project document is incomplete", async () => {
    const database = new FakeDatabase("array");
    database.collections.set(
      "projects",
      new Map([["cpid710r8", { _id: "cpid710r8", id: "cpid710r8", name: "CPID710R8 项目进度管理" }]]),
    );
    const repository = new CloudBaseProjectRepository({ database, projectId: "cpid710r8" });

    expect(await repository.getProject()).toMatchObject({
      id: "cpid710r8",
      name: "CPID710R8 项目进度管理",
      plannedStartDate: "2026-03-30",
      plannedEndDate: "2026-09-28",
    });
  });

  it("reads project metadata by logical id when CloudBase uses an auto-generated document _id", async () => {
    const database = new FakeDatabase();
    database.collections.set(
      "projects",
      new Map([
        [
          "60977a436a36660000ef6fde615ae52c",
          {
            _id: "60977a436a36660000ef6fde615ae52c",
            id: "cpid710r8",
            name: "CPID710R8 项目进度管理",
            plannedStartDate: "2026-03-30",
            plannedEndDate: "2026-09-28",
            calendarMode: "calendar-days",
          },
        ],
      ]),
    );
    const repository = new CloudBaseProjectRepository({ database, projectId: "cpid710r8" });

    await expect(repository.getProject()).resolves.toEqual({
      id: "cpid710r8",
      name: "CPID710R8 项目进度管理",
      plannedStartDate: "2026-03-30",
      plannedEndDate: "2026-09-28",
      calendarMode: "calendar-days",
    });
  });

  it("falls back to the seeded project when CloudBase project metadata is unavailable", async () => {
    class ProjectReadFailureDatabase implements CloudBaseDatabaseLike {
      collection(name: string): CloudBaseCollectionLike {
        return {
          doc: (): CloudBaseDocumentReferenceLike => ({
            get: async () => {
              throw new Error(`permission denied for ${name}`);
            },
            set: async () => ({ id: "cpid710r8" }),
            update: async () => ({ updated: 1 }),
          }),
          where: (): CloudBaseQueryLike => ({
            get: async () => ({ data: [] }),
          }),
        };
      }
    }

    const repository = new CloudBaseProjectRepository({
      database: new ProjectReadFailureDatabase(),
      projectId: "cpid710r8",
    });

    await expect(repository.getProject()).resolves.toMatchObject({
      id: "cpid710r8",
      name: expect.stringContaining("CPID710R8"),
      plannedStartDate: "2026-03-30",
      plannedEndDate: "2026-09-28",
    });
  });

  it("falls back to the complete seeded task list when CloudBase task reads fail", async () => {
    class TaskReadFailureDatabase implements CloudBaseDatabaseLike {
      collection(): CloudBaseCollectionLike {
        return {
          doc: (id: string): CloudBaseDocumentReferenceLike => ({
            get: async () => ({ data: { ...projectToCloudBaseDocument(project), _id: id } }),
            set: async () => ({ id }),
            update: async () => ({ updated: 1 }),
          }),
          where: (): CloudBaseQueryLike => ({
            get: async () => {
              throw new Error("project_tasks permission denied");
            },
          }),
        };
      }
    }

    const repository = new CloudBaseProjectRepository({
      database: new TaskReadFailureDatabase(),
      projectId: "cpid710r8",
    });

    await expect(repository.listTaskInputs()).resolves.toHaveLength(31);
  });
});

describe("CloudBaseProjectRepository writes", () => {
  it("retries a transient project readback mismatch once before failing", async () => {
    class FlakyProjectCollection {
      private readCount = 0;
      private document: Record<string, unknown>;

      constructor(document: Record<string, unknown>) {
        this.document = { ...document };
      }

      doc(id: string) {
        return {
          get: async () => {
            this.readCount += 1;
            if (this.readCount === 1) {
              return {
                data: {
                  ...this.document,
                  plannedStartDate: "2026-03-31",
                },
              };
            }
            return { data: { ...this.document, _id: id } };
          },
          set: async (nextDocument: Record<string, unknown>) => {
            this.document = { ...nextDocument, _id: id };
            return { id };
          },
          update: async (patch: Record<string, unknown>) => {
            this.document = { ...this.document, ...patch, _id: id };
            return { updated: 1 };
          },
        };
      }

      where() {
        return {
          get: async () => ({ data: [] }),
        };
      }
    }

    class FlakyProjectDatabase implements CloudBaseDatabaseLike {
      readonly collections = new Map<string, FlakyProjectCollection>();

      collection(name: string) {
        if (!this.collections.has(name)) {
          this.collections.set(name, new FlakyProjectCollection(projectToCloudBaseDocument(project)));
        }
        return this.collections.get(name)!;
      }
    }

    const repository = new CloudBaseProjectRepository({
      database: new FlakyProjectDatabase(),
      projectId: "cpid710r8",
    });

    await expect(repository.saveProject({ ...project, name: "更新项目" })).resolves.toMatchObject({
      name: "更新项目",
    });
  });

  it("accepts project save readback when CloudBase returns only the document _id", async () => {
    class DocumentIdOnlyCollection {
      private document: Record<string, unknown>;

      constructor(document: Record<string, unknown>) {
        const { id: _idField, ...withoutId } = document;
        this.document = { ...withoutId, _id: project.id };
      }

      doc(id: string) {
        return {
          get: async () => ({ data: { ...this.document, _id: id } }),
          set: async (nextDocument: Record<string, unknown>) => {
            const { id: _idField, ...withoutId } = nextDocument;
            this.document = { ...withoutId, _id: id };
            return { id };
          },
          update: async (patch: Record<string, unknown>) => {
            const { id: _idField, ...withoutId } = patch;
            this.document = { ...this.document, ...withoutId, _id: id };
            return { updated: 1 };
          },
        };
      }

      where() {
        return {
          get: async () => ({ data: [] }),
        };
      }
    }

    class DocumentIdOnlyDatabase implements CloudBaseDatabaseLike {
      private readonly collectionInstance = new DocumentIdOnlyCollection(projectToCloudBaseDocument(project));

      collection() {
        return this.collectionInstance;
      }
    }

    const repository = new CloudBaseProjectRepository({
      database: new DocumentIdOnlyDatabase(),
      projectId: "cpid710r8",
    });

    await expect(
      repository.saveProject({
        ...project,
        plannedStartDate: "2026-04-01",
        plannedEndDate: "2026-10-01",
      }),
    ).resolves.toMatchObject({
      id: "cpid710r8",
      plannedStartDate: "2026-04-01",
      plannedEndDate: "2026-10-01",
    });
  });

  it("retries project save readback long enough for CloudBase write propagation", async () => {
    class EventuallyConsistentProjectCollection {
      private readAfterWriteCount = 0;
      private document = projectToCloudBaseDocument(project);
      private readonly staleDocument = projectToCloudBaseDocument(project);

      doc(id: string) {
        return {
          get: async () => {
            if (this.readAfterWriteCount > 0 && this.readAfterWriteCount < 3) {
              this.readAfterWriteCount += 1;
              return { data: { ...this.staleDocument, _id: id } };
            }
            return { data: { ...this.document, _id: id } };
          },
          set: async (nextDocument: Record<string, unknown>) => {
            this.document = { ...nextDocument, _id: id };
            this.readAfterWriteCount = 1;
            return { id };
          },
          update: async (patch: Record<string, unknown>) => {
            this.document = { ...this.document, ...patch, _id: id };
            this.readAfterWriteCount = 1;
            return { updated: 1 };
          },
        };
      }

      where() {
        return {
          get: async () => ({ data: [] }),
        };
      }
    }

    class EventuallyConsistentProjectDatabase implements CloudBaseDatabaseLike {
      private readonly collectionInstance = new EventuallyConsistentProjectCollection();

      collection() {
        return this.collectionInstance;
      }
    }

    const repository = new CloudBaseProjectRepository({
      database: new EventuallyConsistentProjectDatabase(),
      projectId: "cpid710r8",
    });

    await expect(repository.saveProject({ ...project, plannedStartDate: "2026-04-02" })).resolves.toMatchObject({
      plannedStartDate: "2026-04-02",
    });
  });

  it("updates existing project and task documents instead of inserting duplicates", async () => {
    class UpdateOnlyCollection {
      constructor(private readonly documents: Map<string, Record<string, unknown>>) {}

      doc(id: string) {
        return {
          get: async () => {
            const document = this.documents.get(id);
            return { data: document ? { ...document } : null };
          },
          set: async () => {
            throw {
              code: "DATABASE_REQUEST_FAILED",
              message: `multiple write errors: [{write errors: [{E11000 duplicate key error collection: tnt-nhxtark38.projects index: _id_ dup key: { : \"${id}\" }}]}, {<nil>}]`,
            };
          },
          update: async (patch: Record<string, unknown>) => {
            const current = this.documents.get(id);
            if (!current) throw new Error(`Missing document: ${id}`);
            const next = { ...current, ...patch, _id: id };
            this.documents.set(id, next);
            return { updated: 1 };
          },
        };
      }

      where() {
        return {
          get: async () => ({ data: [...this.documents.values()].map((document) => ({ ...document })) }),
        };
      }
    }

    class UpdateOnlyDatabase implements CloudBaseDatabaseLike {
      readonly collections = new Map<string, Map<string, Record<string, unknown>>>();

      collection(name: string) {
        if (!this.collections.has(name)) this.collections.set(name, new Map());
        return new UpdateOnlyCollection(this.collections.get(name)!);
      }
    }

    const database = new UpdateOnlyDatabase();
    database.collections.set("projects", new Map([["cpid710r8", projectToCloudBaseDocument(project)]]));
    database.collections.set(
      "project_tasks",
      new Map([["task-2", taskToCloudBaseDocument(task({ id: "task-2", taskName: "原任务" }), "cpid710r8")]]),
    );
    const repository = new CloudBaseProjectRepository({ database, projectId: "cpid710r8" });

    await expect(repository.saveProject({ ...project, name: "更新项目" })).resolves.toMatchObject({ name: "更新项目" });
    await expect(repository.saveTaskInput(task({ id: "task-2", taskName: "更新任务", manualCompletionRatio: 0.7 }))).resolves.toMatchObject({
      id: "task-2",
      taskName: "更新任务",
      manualCompletionRatio: 0.7,
    });
  });

  it("updates the auto-id project document when it is found by logical id", async () => {
    const database = new FakeDatabase();
    database.collections.set(
      "projects",
      new Map([
        [
          "60977a436a36660000ef6fde615ae52c",
          {
            _id: "60977a436a36660000ef6fde615ae52c",
            id: "cpid710r8",
            name: "CPID710R8 项目进度管理",
            plannedStartDate: "2026-03-30",
            plannedEndDate: "2026-09-28",
            calendarMode: "calendar-days",
          },
        ],
      ]),
    );
    const repository = new CloudBaseProjectRepository({ database, projectId: "cpid710r8" });

    await expect(repository.saveProject({ ...project, name: "更新后的项目" })).resolves.toMatchObject({
      id: "cpid710r8",
      name: "更新后的项目",
    });

    expect(database.collections.get("projects")?.get("60977a436a36660000ef6fde615ae52c")).toMatchObject({
      id: "cpid710r8",
      name: "更新后的项目",
    });
    expect(database.collections.get("projects")?.has("cpid710r8")).toBe(false);
  });

  it("saves project and task documents", async () => {
    const database = new FakeDatabase();
    const repository = new CloudBaseProjectRepository({ database, projectId: "cpid710r8" });

    await repository.saveProject({ ...project, name: "更新项目" });
    await repository.saveTaskInput(task({ id: "task-2", taskName: "写入任务", manualCompletionRatio: 0.7 }));

    expect(await repository.getProject()).toMatchObject({ id: "cpid710r8", name: "更新项目" });
    expect((await repository.listTaskInputs()).find((item) => item.id === "task-2")).toMatchObject({
      id: "task-2",
      manualCompletionRatio: 0.7,
    });
  });

  it("fails instead of reporting success when CloudBase returns an error body", async () => {
    class ErrorDatabase implements CloudBaseDatabaseLike {
      readonly collections = new Map<string, Map<string, Record<string, unknown>>>();

      collection(name: string): CloudBaseCollectionLike {
        if (!this.collections.has(name)) this.collections.set(name, new Map());
        const documents = this.collections.get(name)!;
        return {
          doc: (id: string): CloudBaseDocumentReferenceLike => ({
            get: async () => {
              const document = documents.get(id);
              if (!document) return { data: null };
              return { data: { ...document } };
            },
            set: async () => ({ code: "INVALID_PARAM", message: "不能更新_id的值" }),
            update: async () => ({ code: "INVALID_PARAM", message: "不能更新_id的值" }),
          }),
          where: (_query: Record<string, unknown>): CloudBaseQueryLike => ({
            get: async () => ({ data: [...documents.values()].map((document) => ({ ...document })) }),
          }),
        };
      }
    }

    const repository = new CloudBaseProjectRepository({ database: new ErrorDatabase(), projectId: "cpid710r8" });

    await expect(repository.saveTaskInput(task({ id: "task-error", taskName: "写入失败任务" }))).rejects.toThrow(
      "CloudBase保存失败：不能更新_id的值",
    );
  });

  it("reports a permission-oriented error when CloudBase updates no existing document", async () => {
    class UpdateZeroDatabase implements CloudBaseDatabaseLike {
      collection(): CloudBaseCollectionLike {
        return {
          doc: (id: string): CloudBaseDocumentReferenceLike => ({
            get: async () => ({ data: { ...projectToCloudBaseDocument(project), _id: id } }),
            set: async () => ({ id }),
            update: async () => ({ updated: 0 }),
          }),
          where: (): CloudBaseQueryLike => ({
            get: async () => ({ data: [] }),
          }),
        };
      }
    }

    const repository = new CloudBaseProjectRepository({ database: new UpdateZeroDatabase(), projectId: "cpid710r8" });

    await expect(repository.saveProject({ ...project, plannedStartDate: "2026-04-03" })).rejects.toThrow(
      "CloudBase保存失败：没有记录被更新，请检查集合写权限或文档归属",
    );
  });

  it("archives and restores tasks without deleting the document", async () => {
    const database = new FakeDatabase();
    const repository = new CloudBaseProjectRepository({ database, projectId: "cpid710r8" });
    await repository.saveTaskInput(task({ id: "task-3", taskName: "可归档任务" }));

    await repository.archiveTask("task-3", "2026-06-20");
    expect((await repository.listTaskInputs()).some((item) => item.id === "task-3")).toBe(false);
    expect((await repository.listTaskInputs({ includeArchived: true })).find((item) => item.id === "task-3")).toMatchObject({
      id: "task-3",
      isArchived: true,
      archivedAt: "2026-06-20",
    });

    await repository.restoreTask("task-3");
    expect((await repository.listTaskInputs()).find((item) => item.id === "task-3")).toMatchObject({
      id: "task-3",
      isArchived: false,
      archivedAt: undefined,
    });
  });
});
