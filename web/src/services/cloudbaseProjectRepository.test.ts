import { describe, expect, it } from "vitest";
import type { Project, ProjectTaskInput } from "../types/project";
import {
  CloudBaseProjectRepository,
  projectFromCloudBaseDocument,
  projectToCloudBaseDocument,
  taskFromCloudBaseDocument,
  taskToCloudBaseDocument,
  type CloudBaseDatabaseLike,
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
  constructor(private readonly documents: Map<string, Record<string, unknown>>) {}

  doc(id: string) {
    return {
      get: async () => ({ data: this.documents.get(id) ? { ...this.documents.get(id) } : null }),
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

  collection(name: string) {
    if (!this.collections.has(name)) this.collections.set(name, new Map());
    return new FakeCollection(this.collections.get(name)!);
  }
}

describe("CloudBase project document mapping", () => {
  it("round-trips project fields without service-side secrets", () => {
    const document = projectToCloudBaseDocument(project);
    expect(document).toMatchObject({
      _id: "cpid710r8",
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
    expect(document).toMatchObject({ _id: "task-1", projectId: "cpid710r8", manualCompletionRatio: 0.45 });
    expect(taskFromCloudBaseDocument(document)).toEqual(input);
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
    expect((await repository.listTaskInputs()).map((item) => item.id)).toEqual(["active"]);
    expect((await repository.listTaskInputs({ includeArchived: true })).map((item) => item.id)).toEqual([
      "active",
      "archived",
    ]);
  });
});

describe("CloudBaseProjectRepository writes", () => {
  it("saves project and task documents", async () => {
    const database = new FakeDatabase();
    const repository = new CloudBaseProjectRepository({ database, projectId: "cpid710r8" });

    await repository.saveProject({ ...project, name: "更新项目" });
    await repository.saveTaskInput(task({ id: "task-2", taskName: "写入任务", manualCompletionRatio: 0.7 }));

    expect(await repository.getProject()).toMatchObject({ id: "cpid710r8", name: "更新项目" });
    expect(await repository.listTaskInputs()).toMatchObject([{ id: "task-2", manualCompletionRatio: 0.7 }]);
  });

  it("archives and restores tasks without deleting the document", async () => {
    const database = new FakeDatabase();
    const repository = new CloudBaseProjectRepository({ database, projectId: "cpid710r8" });
    await repository.saveTaskInput(task({ id: "task-3", taskName: "可归档任务" }));

    await repository.archiveTask("task-3", "2026-06-20");
    expect(await repository.listTaskInputs()).toEqual([]);
    expect((await repository.listTaskInputs({ includeArchived: true }))[0]).toMatchObject({
      id: "task-3",
      isArchived: true,
      archivedAt: "2026-06-20",
    });

    await repository.restoreTask("task-3");
    expect((await repository.listTaskInputs())[0]).toMatchObject({
      id: "task-3",
      isArchived: false,
      archivedAt: undefined,
    });
  });
});
