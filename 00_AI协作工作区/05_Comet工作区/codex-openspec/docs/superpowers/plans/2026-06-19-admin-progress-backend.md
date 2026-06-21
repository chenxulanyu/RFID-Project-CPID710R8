---
change: admin-progress-backend
design-doc: docs/superpowers/specs/2026-06-19-admin-progress-backend-design.md
base-ref: fce3b6781c7ce754fae9a5dd976635f489d4c0fa
archived-with: 2026-06-19-admin-progress-backend
---

# Admin Progress Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the CPID710R8 admin maintenance flow for project metadata, task create/update, archive/restore, local persistence, validation, and dashboard read integration.

**Architecture:** Extend the existing project repository/service boundary so public dashboard reads and admin writes share one data contract. Use a localStorage-backed repository for the first version, with validation and admin service methods isolated from UI components. Replace `/admin` with a left-list/right-detail admin page that preserves overflow-safe layout constraints.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Testing Library, CSS, browser `localStorage`.

## File Structure

- Modify `web/src/types/project.ts`: add admin-maintained task fields `manualCompletionRatio`, `isArchived`, and `archivedAt`.
- Modify `web/src/services/projectRepository.ts`: extend repository contract with admin write methods and implement `LocalProjectRepository` plus test-friendly memory storage.
- Modify `web/src/services/projectService.ts`: use active-task reads by default, apply manual completion ratio priority, and preserve actual end date as highest priority.
- Create `web/src/services/projectValidation.ts`: validation helpers and `ProjectValidationError`.
- Create `web/src/services/projectAdminService.ts`: admin read/write service methods.
- Create `web/src/services/projectAdminService.test.ts`: TDD coverage for metadata, task create/update, archive/restore, validation, and manual completion priority.
- Replace `web/src/features/project/AdminPlaceholder.tsx` with `AdminPage.tsx`, or make `AdminPlaceholder.tsx` delegate to the new page.
- Create `web/src/features/project/AdminPage.test.tsx`: component coverage for left-list/right-detail, save, validation errors, archive, and restore.
- Modify `web/src/app/App.tsx` and `web/src/app/App.test.tsx`: route `/admin` to admin maintenance page and update nav text.
- Modify `web/src/styles.css`: admin layout, forms, list, archive badges, validation errors, and responsive overflow safeguards.
- Modify `00_AI协作工作区/03_版本迭代/VERSION.md`: add/update `admin-progress-backend` business version.
- Modify `00_AI协作工作区/03_版本迭代/CHANGELOG.md`: record admin maintenance implementation and validation.
- Modify `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/admin-progress-backend/tasks.md`: check off tasks as each implementation slice completes.

## Task 1: Repository Contract And Derived Read Model

**Files:**
- Modify: `web/src/types/project.ts`
- Modify: `web/src/services/projectRepository.ts`
- Modify: `web/src/services/projectService.ts`
- Create/Modify: `web/src/services/projectAdminService.test.ts`

- [x] **Step 1: Write failing service tests for active reads, manual progress, and actual end priority**

Add tests to `web/src/services/projectAdminService.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Project, ProjectTaskInput } from "../types/project";
import { getProjectProgress } from "./projectService";
import { LocalProjectRepository } from "./projectRepository";

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
```

- [x] **Step 2: Run tests and verify they fail for missing admin fields/repository**

Run:

```bash
cd web
npm test -- src/services/projectAdminService.test.ts
```

Expected: FAIL because `LocalProjectRepository`, admin task fields, or filtering behavior is missing.

- [x] **Step 3: Extend project types**

Update `web/src/types/project.ts`:

```ts
export interface ProjectTaskInput {
  id: string;
  milestoneCode: string;
  projectContent: string;
  taskName: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  resourceOwner: string;
  responsiblePerson: string;
  remarks?: string;
  manualCompletionRatio?: number;
  isArchived?: boolean;
  archivedAt?: string;
}
```

- [x] **Step 4: Implement repository contract and local snapshot adapter**

Update `web/src/services/projectRepository.ts`:

```ts
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
```

- [x] **Step 5: Update derived completion priority**

Modify `deriveTask` in `web/src/services/projectService.ts` so completion follows actual-end, manual, automatic:

```ts
const automaticCompletionRatio = calculateCompletionRatio({
  plannedDurationDays,
  elapsedDays: numericElapsedDays,
  isFinished,
});

return {
  ...input,
  plannedDurationDays,
  actualDurationDays,
  elapsedDays,
  completionRatio: isFinished ? 1 : input.manualCompletionRatio ?? automaticCompletionRatio,
  overdueDays,
  warningState,
};
```

- [x] **Step 6: Run tests and commit**

Run:

```bash
cd web
npm test -- src/services/projectAdminService.test.ts
npm test
```

Expected: PASS.

Commit:

```bash
git add web/src/types/project.ts web/src/services/projectRepository.ts web/src/services/projectService.ts web/src/services/projectAdminService.test.ts
git commit -m "feat: add admin repository data contract"
```

## Task 2: Admin Validation And Write Service

**Files:**
- Create: `web/src/services/projectValidation.ts`
- Create: `web/src/services/projectAdminService.ts`
- Modify: `web/src/services/projectAdminService.test.ts`
- Modify: `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/admin-progress-backend/tasks.md`

- [x] **Step 1: Add failing validation and write-service tests**

Append to `web/src/services/projectAdminService.test.ts`:

```ts
import {
  archiveProjectTask,
  createProjectTask,
  restoreProjectTask,
  saveProjectMetadata,
  updateProjectTask,
} from "./projectAdminService";
import { ProjectValidationError } from "./projectValidation";

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
});
```

- [x] **Step 2: Run tests and verify they fail**

Run:

```bash
cd web
npm test -- src/services/projectAdminService.test.ts
```

Expected: FAIL because `projectAdminService` and `projectValidation` are missing.

- [x] **Step 3: Implement validation helpers**

Create `web/src/services/projectValidation.ts`:

```ts
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
```

- [x] **Step 4: Implement admin service methods**

Create `web/src/services/projectAdminService.ts`:

```ts
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
```

- [x] **Step 5: Run tests, update OpenSpec task checkboxes, and commit**

Run:

```bash
cd web
npm test -- src/services/projectAdminService.test.ts
npm test
```

Expected: PASS.

Update `admin-progress-backend/tasks.md` checkboxes for data flow and validation tasks completed by this slice:

```md
- [x] 1.1 ...
- [x] 1.2 ...
- [x] 1.3 ...
- [x] 1.4 ...
- [x] 3.1 ...
- [x] 3.2 ...
- [x] 3.3 ...
- [x] 3.4 ...
- [x] 3.5 ...
- [x] 4.1 ...
- [x] 4.2 ...
- [x] 4.3 ...
- [x] 4.4 ...
- [x] 4.5 ...
```

Commit:

```bash
git add web/src/services/projectValidation.ts web/src/services/projectAdminService.ts web/src/services/projectAdminService.test.ts "00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/admin-progress-backend/tasks.md"
git commit -m "feat: add admin project write service"
```

## Task 3: Admin Maintenance UI

**Files:**
- Create: `web/src/features/project/AdminPage.tsx`
- Create: `web/src/features/project/AdminPage.test.tsx`
- Modify: `web/src/features/project/AdminPlaceholder.tsx`
- Modify: `web/src/app/App.tsx`
- Modify: `web/src/app/App.test.tsx`
- Modify: `web/src/styles.css`
- Modify: `00_AI协作工作区/03_版本迭代/VERSION.md`
- Modify: `00_AI协作工作区/03_版本迭代/CHANGELOG.md`
- Modify: `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/admin-progress-backend/tasks.md`

- [x] **Step 1: Write failing admin page tests**

Create `web/src/features/project/AdminPage.test.tsx`:

```tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminPage } from "./AdminPage";

describe("AdminPage", () => {
  it("renders project metadata and a left-list right-detail task editor", async () => {
    render(<AdminPage today="2026-06-19" />);

    expect(await screen.findByRole("heading", { name: "后台进度维护" })).toBeInTheDocument();
    expect(screen.getByLabelText("项目名称")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "任务列表" })).toBeInTheDocument();
    expect(screen.getByLabelText("任务名称")).toBeInTheDocument();
  });

  it("saves a task update and shows a success message", async () => {
    render(<AdminPage today="2026-06-19" />);

    const taskName = await screen.findByLabelText("任务名称");
    fireEvent.change(taskName, { target: { value: "更新后的任务名称" } });
    fireEvent.click(screen.getByRole("button", { name: "保存任务" }));

    expect(await screen.findByRole("status")).toHaveTextContent("任务已保存");
    expect(screen.getByText("更新后的任务名称")).toBeInTheDocument();
  });

  it("shows validation errors for invalid planned dates", async () => {
    render(<AdminPage today="2026-06-19" />);

    fireEvent.change(await screen.findByLabelText("计划开始"), { target: { value: "2026-06-10" } });
    fireEvent.change(screen.getByLabelText("计划结束"), { target: { value: "2026-06-01" } });
    fireEvent.click(screen.getByRole("button", { name: "保存任务" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("计划结束日期不能早于开始日期");
  });

  it("creates, archives, and restores a task", async () => {
    render(<AdminPage today="2026-06-19" />);

    fireEvent.click(await screen.findByRole("button", { name: "新增任务" }));
    fireEvent.change(screen.getByLabelText("任务 ID"), { target: { value: "NEW-001" } });
    fireEvent.change(screen.getByLabelText("里程碑"), { target: { value: "M9" } });
    fireEvent.change(screen.getByLabelText("项目内容"), { target: { value: "新增内容" } });
    fireEvent.change(screen.getByLabelText("任务名称"), { target: { value: "新增后台任务" } });
    fireEvent.change(screen.getByLabelText("计划开始"), { target: { value: "2026-07-01" } });
    fireEvent.change(screen.getByLabelText("计划结束"), { target: { value: "2026-07-05" } });
    fireEvent.change(screen.getByLabelText("资源方"), { target: { value: "芯联" } });
    fireEvent.change(screen.getByLabelText("责任人"), { target: { value: "负责人" } });
    fireEvent.click(screen.getByRole("button", { name: "保存任务" }));

    expect(await screen.findByText("新增后台任务")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "归档任务" }));
    fireEvent.click(screen.getByRole("button", { name: "已归档" }));
    const archivedList = screen.getByRole("list", { name: "任务列表" });
    expect(within(archivedList).getByText("新增后台任务")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "恢复任务" }));
    fireEvent.click(screen.getByRole("button", { name: "活跃任务" }));
    expect(screen.getByText("新增后台任务")).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run tests and verify they fail**

Run:

```bash
cd web
npm test -- src/features/project/AdminPage.test.tsx
```

Expected: FAIL because `AdminPage` is missing.

- [x] **Step 3: Implement admin page and route**

Create `web/src/features/project/AdminPage.tsx` with:

- local `LocalProjectRepository` instance
- load admin project data via `getAdminProjectData`
- project metadata form
- active/archived task filter
- task list
- detail form fields matching tests
- buttons: `新增任务`, `保存任务`, `归档任务`, `恢复任务`
- validation error rendering with `role="alert"`
- success rendering with `role="status"`

Keep the implementation focused in one file for the first pass. Extract smaller components only if the file becomes difficult to follow.

Modify `web/src/features/project/AdminPlaceholder.tsx`:

```tsx
import { AdminPage } from "./AdminPage";

export function AdminPlaceholder() {
  return <AdminPage />;
}
```

Modify `web/src/app/App.tsx` nav text:

```tsx
<a href="/admin">后台维护</a>
```

- [x] **Step 4: Add admin CSS**

Append admin styles to `web/src/styles.css`:

```css
.admin-layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
}

.admin-panel {
  background: #ffffff;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  min-width: 0;
  padding: 16px;
}

.admin-task-list {
  display: grid;
  gap: 8px;
  list-style: none;
  margin: 0;
  max-height: 540px;
  overflow: auto;
  padding: 0;
}

.admin-task-button {
  background: #f7f9fc;
  border: 1px solid #d8dee8;
  border-radius: 6px;
  color: #17202a;
  cursor: pointer;
  display: grid;
  gap: 4px;
  padding: 10px;
  text-align: left;
  width: 100%;
}

.admin-task-button strong,
.admin-task-button span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.admin-field {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.admin-field label {
  color: #526173;
  font-size: 12px;
  font-weight: 800;
}

.admin-field input,
.admin-field textarea,
.admin-field select {
  border: 1px solid #c9d3df;
  border-radius: 6px;
  color: #17202a;
  font: inherit;
  min-width: 0;
  padding: 9px 10px;
}

.admin-field textarea {
  min-height: 76px;
  resize: vertical;
}

.admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.admin-message {
  border-radius: 6px;
  margin-top: 12px;
  overflow-wrap: anywhere;
  padding: 10px 12px;
}

.admin-message.error {
  background: #fff1f0;
  color: #9f2d24;
}

.admin-message.success {
  background: #eaf7ef;
  color: #246b3d;
}

@media (max-width: 900px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .admin-form-grid {
    grid-template-columns: 1fr;
  }
}
```

- [x] **Step 5: Run component tests and full suite**

Run:

```bash
cd web
npm test -- src/features/project/AdminPage.test.tsx
npm test
npm run build
```

Expected: PASS.

- [x] **Step 6: Update version records and tasks**

Update `00_AI协作工作区/03_版本迭代/VERSION.md`:

```md
- `admin-progress-backend`: `v1.0`
```

Update `00_AI协作工作区/03_版本迭代/CHANGELOG.md` with:

```md
## admin-progress-backend v1.0 - 2026-06-19

- 新增后台进度维护入口，支持项目元数据编辑和任务左表右详情维护。
- 新增任务创建、编辑、软归档和恢复能力；展示端默认隐藏归档任务。
- 新增 localStorage 本地持久化 repository，为后续 CloudBase adapter 预留替换边界。
- 新增手动完成比例覆盖规则；实际结束日期优先，完成比例视为 100%。
- 新增校验：必填字段、日期顺序、手动完成比例范围、重复任务 ID。
- 新增服务层和组件测试。
```

Update OpenSpec tasks:

```md
- [x] 2.1 ...
- [x] 2.2 ...
- [x] 2.3 ...
- [x] 2.4 ...
```

- [x] **Step 7: Commit**

Commit:

```bash
git add web/src/features/project/AdminPage.tsx web/src/features/project/AdminPage.test.tsx web/src/features/project/AdminPlaceholder.tsx web/src/app/App.tsx web/src/app/App.test.tsx web/src/styles.css "00_AI协作工作区/03_版本迭代/VERSION.md" "00_AI协作工作区/03_版本迭代/CHANGELOG.md" "00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/admin-progress-backend/tasks.md"
git commit -m "feat: add admin progress maintenance UI"
```

## Final Build Gate

- [x] **Step 1: Run full verification**

Run:

```bash
cd web
npm test
npm run build
```

Expected: PASS.

- [x] **Step 2: Run OpenSpec validation**

Run:

```bash
cd 00_AI协作工作区/05_Comet工作区/codex-openspec
openspec validate admin-progress-backend --strict
```

Expected: PASS.

- [x] **Step 3: Confirm tasks complete**

Run:

```bash
rg -n "\- \[ \]" 00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/admin-progress-backend/tasks.md
```

Expected: no output.
