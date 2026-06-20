import { describe, expect, it } from "vitest";
import type { Project, ProjectTaskInput } from "../types/project";
import {
  archiveProjectTask,
  createProjectTask,
  restoreProjectTask,
  saveProjectMetadata,
} from "./projectAdminService";
import { LocalProjectRepository } from "./projectRepository";
import { getProjectProgress } from "./projectService";
import { ProjectValidationError } from "./projectValidation";

const project: Project = {
  id: "cpid710r8",
  name: "测试项目",
  plannedStartDate: "2026-03-30",
  plannedEndDate: "2026-09-28",
  calendarMode: "calendar-days",
};

function task(overrides: Partial<ProjectTaskInput> & Pick<ProjectTaskInput, "id" | "taskName">): ProjectTaskInput {
  return {
    id: overrides.id,
    milestoneCode: overrides.milestoneCode ?? "M1",
    projectContent: overrides.projectContent ?? "测试内容",
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

describe("admin repository read integration", () => {
  it("hides archived tasks from public project progress reads", async () => {
    const repository = LocalProjectRepository.fromSnapshot({
      project,
      tasks: [
        task({ id: "active", taskName: "活跃任务" }),
        task({ id: "archived", taskName: "归档任务", isArchived: true, archivedAt: "2026-06-19" }),
      ],
    });

    const data = await getProjectProgress("2026-06-19", repository);

    expect(data.tasks.map((item) => item.id)).toEqual(["active"]);
  });

  it("uses manual completion ratio for active unfinished tasks", async () => {
    const repository = LocalProjectRepository.fromSnapshot({
      project,
      tasks: [task({ id: "manual", taskName: "手动进度", manualCompletionRatio: 0.42 })],
    });

    const data = await getProjectProgress("2026-06-19", repository);

    expect(data.tasks[0].completionRatio).toBe(0.42);
  });

  it("treats actual end date as complete even when manual completion is lower", async () => {
    const repository = LocalProjectRepository.fromSnapshot({
      project,
      tasks: [
        task({
          id: "done",
          taskName: "已完成",
          actualStartDate: "2026-06-01",
          actualEndDate: "2026-06-05",
          manualCompletionRatio: 0.4,
        }),
      ],
    });

    const data = await getProjectProgress("2026-06-19", repository);

    expect(data.tasks[0].completionRatio).toBe(1);
    expect(data.tasks[0].elapsedDays).toBe("finished");
  });
});

describe("admin write service", () => {
  it("saves project metadata and returns it in public reads", async () => {
    const repository = LocalProjectRepository.fromSnapshot({ project, tasks: [] });

    await saveProjectMetadata(repository, { ...project, name: "更新后的项目" });
    const data = await getProjectProgress("2026-06-19", repository);

    expect(data.project.name).toBe("更新后的项目");
  });

  it("creates a task and exposes it through public progress reads", async () => {
    const repository = LocalProjectRepository.fromSnapshot({ project, tasks: [] });

    await createProjectTask(repository, task({ id: "new-task", taskName: "新增任务" }));
    const data = await getProjectProgress("2026-06-19", repository);

    expect(data.tasks.map((item) => item.id)).toEqual(["new-task"]);
  });

  it("archives and restores a task without physical deletion", async () => {
    const repository = LocalProjectRepository.fromSnapshot({
      project,
      tasks: [task({ id: "task-1", taskName: "可归档任务" })],
    });

    await archiveProjectTask(repository, "task-1", "2026-06-19");
    expect((await getProjectProgress("2026-06-19", repository)).tasks).toHaveLength(0);
    expect((await repository.listTaskInputs({ includeArchived: true }))[0].isArchived).toBe(true);

    await restoreProjectTask(repository, "task-1");
    expect((await getProjectProgress("2026-06-19", repository)).tasks.map((item) => item.id)).toEqual([
      "task-1",
    ]);
  });

  it("rejects invalid task dates with a validation error", async () => {
    const repository = LocalProjectRepository.fromSnapshot({ project, tasks: [] });

    await expect(
      createProjectTask(
        repository,
        task({
          id: "bad-date",
          taskName: "错误日期",
          plannedStartDate: "2026-06-10",
          plannedEndDate: "2026-06-01",
        }),
      ),
    ).rejects.toBeInstanceOf(ProjectValidationError);
  });

  it("rejects duplicate task ids on create", async () => {
    const repository = LocalProjectRepository.fromSnapshot({
      project,
      tasks: [task({ id: "same", taskName: "原任务" })],
    });

    await expect(createProjectTask(repository, task({ id: "same", taskName: "重复任务" }))).rejects.toThrow(
      "任务 ID 已存在",
    );
  });

  it("rejects manual completion ratio outside 0 to 1", async () => {
    const repository = LocalProjectRepository.fromSnapshot({ project, tasks: [] });

    await expect(
      createProjectTask(repository, task({ id: "bad-ratio", taskName: "错误进度", manualCompletionRatio: 1.2 })),
    ).rejects.toThrow("完成比例必须在 0 到 100% 之间");
  });

  it("persists admin changes across local repository instances", async () => {
    const storage = new Map<string, string>();
    const firstRepository = new LocalProjectRepository({
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      },
      storageKey: "test-project",
      initialSnapshot: { project, tasks: [] },
    });

    await saveProjectMetadata(firstRepository, { ...project, name: "持久化项目" });
    await createProjectTask(firstRepository, task({ id: "persisted-task", taskName: "持久化任务" }));

    const secondRepository = new LocalProjectRepository({
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      },
      storageKey: "test-project",
      initialSnapshot: { project, tasks: [] },
    });

    const data = await getProjectProgress("2026-06-19", secondRepository);

    expect(data.project.name).toBe("持久化项目");
    expect(data.tasks.map((item) => item.id)).toEqual(["persisted-task"]);
  });

  it("upgrades a legacy browser snapshot to the complete default seed", async () => {
    const storage = new Map<string, string>();
    storage.set(
      "test-project",
      JSON.stringify({
        project,
        tasks: [
          task({ id: "M1-001", taskName: "硬件架构选型+关键器件确认" }),
          task({
            id: "M5-002",
            milestoneCode: "M5",
            projectContent: "V1.0 PCBA打样",
            taskName: "PCB板/屏蔽盖/物料",
          }),
          task({
            id: "M6-001",
            milestoneCode: "M6",
            projectContent: "测试固件&驱动开发",
            taskName: "完成单片机测试固件",
          }),
        ],
      }),
    );

    const repository = new LocalProjectRepository({
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      },
      storageKey: "test-project",
      initialSnapshot: { project, tasks: [] },
    });

    const tasks = await repository.listTaskInputs({ includeArchived: true });

    expect(tasks).toHaveLength(31);
    expect(new Set(tasks.map((item) => item.milestoneCode)).size).toBe(20);
  });
});
