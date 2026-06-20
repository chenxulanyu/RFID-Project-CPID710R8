---
change: cloudbase-persistence
design-doc: docs/superpowers/specs/2026-06-20-cloudbase-persistence-design.md
base-ref: ba22e83ab71fc990e92442f778adfa1ccce88b02
---

# CloudBase Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Tencent CloudBase-backed project repository while keeping the current local fallback and secret-safe static frontend deployment path.

**Architecture:** CloudBase is added behind the existing `ProjectRepository` service boundary. A small repository factory selects local or CloudBase data sources from Vite environment variables. CloudBase document conversion stays isolated from React components.

**Tech Stack:** React, Vite, TypeScript, Vitest, `@cloudbase/js-sdk` v3, Tencent CloudBase document database.

---

## File Structure

- Create `web/src/services/cloudbaseProjectRepository.ts`: CloudBase document types, conversion helpers, client abstraction, and `CloudBaseProjectRepository`.
- Create `web/src/services/cloudbaseProjectRepository.test.ts`: TDD coverage for mapping, read/write, archive/restore, and include-archived behavior using a mock CloudBase client.
- Create `web/src/services/projectRepositoryFactory.ts`: data source configuration parsing and repository creation.
- Create `web/src/services/projectRepositoryFactory.test.ts`: fallback and CloudBase selection tests.
- Modify `web/src/services/projectService.ts`: default repository should come from the factory instead of directly constructing `DefaultProjectRepository`.
- Modify `web/src/features/project/AdminPlaceholder.tsx`: default admin repository should come from the factory so `/admin` can write CloudBase when configured.
- Create `web/.env.example`: placeholder-only CloudBase configuration.
- Modify `.gitignore`: keep `.env` ignored while allowing `.env.example`.
- Modify `web/README.md`: document CloudBase mode, secret boundary,安全域名/权限要求, and verification path.
- Modify `00_AI协作工作区/03_版本迭代/VERSION.md` and `00_AI协作工作区/03_版本迭代/CHANGELOG.md`: record the CloudBase persistence iteration.
- Modify `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/cloudbase-persistence/tasks.md`: check off tasks only after implementation and verification.

## Task 1: CloudBase Repository Mapping And Reads

**Files:**
- Create: `web/src/services/cloudbaseProjectRepository.ts`
- Create: `web/src/services/cloudbaseProjectRepository.test.ts`

- [x] **Step 1: Write failing mapping and read tests**

Create `web/src/services/cloudbaseProjectRepository.test.ts` with:

```ts
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
    database.collections.set(
      "projects",
      new Map([["cpid710r8", projectToCloudBaseDocument(project)]]),
    );
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
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
cd web && npm test -- src/services/cloudbaseProjectRepository.test.ts
```

Expected: FAIL because `cloudbaseProjectRepository.ts` does not exist.

- [x] **Step 3: Implement mapping helpers and read repository**

Create `web/src/services/cloudbaseProjectRepository.ts` with the minimal implementation for the tests:

```ts
import type { Project, ProjectTaskInput } from "../types/project";
import type { ListTaskOptions, ProjectRepository } from "./projectRepository";

type CloudBaseDocument = Record<string, unknown>;

export interface CloudBaseDocumentReferenceLike {
  get(): Promise<{ data: CloudBaseDocument | null }>;
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
    if (!response.data) throw new Error(`CloudBase project not found: ${this.projectId}`);
    return projectFromCloudBaseDocument(response.data);
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
```

- [x] **Step 4: Run test to verify it passes**

Run:

```bash
cd web && npm test -- src/services/cloudbaseProjectRepository.test.ts
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add web/src/services/cloudbaseProjectRepository.ts web/src/services/cloudbaseProjectRepository.test.ts
git commit -m "feat: add cloudbase repository mapping"
```

## Task 2: CloudBase Writes And Admin Semantics

**Files:**
- Modify: `web/src/services/cloudbaseProjectRepository.test.ts`
- Modify: `web/src/services/cloudbaseProjectRepository.ts`

- [x] **Step 1: Add failing write tests**

Append to `web/src/services/cloudbaseProjectRepository.test.ts`:

```ts
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
```

- [x] **Step 2: Run test to verify failure if behavior is incomplete**

Run:

```bash
cd web && npm test -- src/services/cloudbaseProjectRepository.test.ts
```

Expected: FAIL only if the initial Task 1 implementation does not fully preserve write/archive semantics. If it already passes, record in the commit body that Task 1 implementation covered the behavior.

- [x] **Step 3: Adjust implementation only if needed**

If the restore assertion fails because `archivedAt` remains present, update `restoreTask` in `web/src/services/cloudbaseProjectRepository.ts` to save a task object without `archivedAt`:

```ts
async restoreTask(taskId: string): Promise<ProjectTaskInput> {
  const task = (await this.listTaskInputs({ includeArchived: true })).find((item) => item.id === taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);
  const { archivedAt: _archivedAt, ...restored } = task;
  return this.saveTaskInput({ ...restored, isArchived: false });
}
```

- [x] **Step 4: Run tests**

Run:

```bash
cd web && npm test -- src/services/cloudbaseProjectRepository.test.ts
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add web/src/services/cloudbaseProjectRepository.ts web/src/services/cloudbaseProjectRepository.test.ts
git commit -m "test: cover cloudbase repository writes"
```

## Task 3: Repository Factory And Web SDK Boundary

**Files:**
- Create: `web/src/services/projectRepositoryFactory.ts`
- Create: `web/src/services/projectRepositoryFactory.test.ts`
- Modify: `web/package.json`
- Modify: `web/package-lock.json`

- [x] **Step 1: Install CloudBase Web SDK**

Run:

```bash
cd web && npm install @cloudbase/js-sdk
```

Expected: `@cloudbase/js-sdk` appears in `dependencies`.

- [x] **Step 2: Write failing factory tests**

Create `web/src/services/projectRepositoryFactory.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CloudBaseProjectRepository } from "./cloudbaseProjectRepository";
import { LocalProjectRepository } from "./projectRepository";
import { createProjectRepository, readProjectDataSourceConfig } from "./projectRepositoryFactory";

describe("project repository factory", () => {
  it("falls back to local repository when CloudBase config is missing", () => {
    const config = readProjectDataSourceConfig({});
    const repository = createProjectRepository(config);

    expect(config.source).toBe("local");
    expect(repository).toBeInstanceOf(LocalProjectRepository);
  });

  it("uses CloudBase repository when cloudbase config is complete", () => {
    const database = { collection: () => ({}) } as never;
    const config = readProjectDataSourceConfig({
      VITE_PROJECT_DATA_SOURCE: "cloudbase",
      VITE_CLOUDBASE_ENV_ID: "env-test",
      VITE_CLOUDBASE_ACCESS_KEY: "public-key",
      VITE_CLOUDBASE_PROJECT_ID: "cpid710r8",
      VITE_CLOUDBASE_PROJECTS_COLLECTION: "projects",
      VITE_CLOUDBASE_TASKS_COLLECTION: "project_tasks",
    });

    const repository = createProjectRepository(config, { database });

    expect(repository).toBeInstanceOf(CloudBaseProjectRepository);
  });

  it("rejects service-side secrets in frontend config", () => {
    expect(() =>
      readProjectDataSourceConfig({
        VITE_PROJECT_DATA_SOURCE: "cloudbase",
        VITE_CLOUDBASE_ENV_ID: "env-test",
        VITE_CLOUDBASE_SECRET_ID: "must-not-exist",
        VITE_CLOUDBASE_SECRET_KEY: "must-not-exist",
      }),
    ).toThrow("CloudBase frontend config must not contain secretId or secretKey");
  });
});
```

- [x] **Step 3: Run test to verify it fails**

Run:

```bash
cd web && npm test -- src/services/projectRepositoryFactory.test.ts
```

Expected: FAIL because `projectRepositoryFactory.ts` does not exist.

- [x] **Step 4: Implement repository factory**

Create `web/src/services/projectRepositoryFactory.ts`:

```ts
import cloudbase from "@cloudbase/js-sdk";
import { CloudBaseProjectRepository, type CloudBaseDatabaseLike } from "./cloudbaseProjectRepository";
import { DefaultProjectRepository, type ProjectRepository } from "./projectRepository";

export type ProjectDataSource = "local" | "cloudbase";

export interface ProjectDataSourceConfig {
  source: ProjectDataSource;
  cloudbase?: {
    envId: string;
    accessKey?: string;
    projectId: string;
    projectsCollection: string;
    tasksCollection: string;
  };
}

export interface ProjectRepositoryFactoryDependencies {
  database?: CloudBaseDatabaseLike;
}

type EnvRecord = Record<string, string | undefined>;

const defaultProjectsCollection = "projects";
const defaultTasksCollection = "project_tasks";

export function readProjectDataSourceConfig(env: EnvRecord = import.meta.env): ProjectDataSourceConfig {
  if (env.VITE_CLOUDBASE_SECRET_ID || env.VITE_CLOUDBASE_SECRET_KEY) {
    throw new Error("CloudBase frontend config must not contain secretId or secretKey");
  }

  if (env.VITE_PROJECT_DATA_SOURCE !== "cloudbase") {
    return { source: "local" };
  }

  const envId = env.VITE_CLOUDBASE_ENV_ID;
  const projectId = env.VITE_CLOUDBASE_PROJECT_ID;
  if (!envId || !projectId) {
    return { source: "local" };
  }

  return {
    source: "cloudbase",
    cloudbase: {
      envId,
      accessKey: env.VITE_CLOUDBASE_ACCESS_KEY,
      projectId,
      projectsCollection: env.VITE_CLOUDBASE_PROJECTS_COLLECTION ?? defaultProjectsCollection,
      tasksCollection: env.VITE_CLOUDBASE_TASKS_COLLECTION ?? defaultTasksCollection,
    },
  };
}

function createCloudBaseDatabase(config: NonNullable<ProjectDataSourceConfig["cloudbase"]>): CloudBaseDatabaseLike {
  const app = cloudbase.init({
    env: config.envId,
    accessKey: config.accessKey,
  });
  return app.database() as CloudBaseDatabaseLike;
}

export function createProjectRepository(
  config: ProjectDataSourceConfig = readProjectDataSourceConfig(),
  dependencies: ProjectRepositoryFactoryDependencies = {},
): ProjectRepository {
  if (config.source !== "cloudbase" || !config.cloudbase) {
    return new DefaultProjectRepository();
  }

  return new CloudBaseProjectRepository({
    database: dependencies.database ?? createCloudBaseDatabase(config.cloudbase),
    projectId: config.cloudbase.projectId,
    projectsCollection: config.cloudbase.projectsCollection,
    tasksCollection: config.cloudbase.tasksCollection,
  });
}
```

- [x] **Step 5: Run factory tests**

Run:

```bash
cd web && npm test -- src/services/projectRepositoryFactory.test.ts
```

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add web/package.json web/package-lock.json web/src/services/projectRepositoryFactory.ts web/src/services/projectRepositoryFactory.test.ts
git commit -m "feat: add project repository factory"
```

## Task 4: Wire Default Services To Repository Factory

**Files:**
- Modify: `web/src/services/projectService.ts`
- Modify: `web/src/features/project/AdminPlaceholder.tsx`
- Modify: `web/src/services/projectService.test.ts`
- Modify: `web/src/features/project/AdminPage.test.tsx`

- [x] **Step 1: Write failing service wiring test**

Update `web/src/services/projectService.test.ts` imports and add a mock before the describe block:

```ts
import { vi } from "vitest";
import { LocalProjectRepository } from "./projectRepository";

vi.mock("./projectRepositoryFactory", () => ({
  createProjectRepository: vi.fn(() =>
    LocalProjectRepository.fromSnapshot({
      project: {
        id: "factory-project",
        name: "工厂项目",
        plannedStartDate: "2026-01-01",
        plannedEndDate: "2026-01-31",
        calendarMode: "calendar-days",
      },
      tasks: [],
    }),
  ),
}));
```

Then add:

```ts
it("uses the repository factory for default reads", async () => {
  const data = await getProjectProgress("2026-06-20");
  expect(data.project.id).toBe("factory-project");
});
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
cd web && npm test -- src/services/projectService.test.ts
```

Expected: FAIL because `getProjectProgress` still constructs `DefaultProjectRepository` directly.

- [x] **Step 3: Update project service default repository**

Modify `web/src/services/projectService.ts`:

```ts
import type { ProjectProgressData, ProjectTask, ProjectTaskInput } from "../types/project";
import { calculateCompletionRatio, calculateDateProgress, calculateDurationDays, getWarningState } from "../utils/progress";
import type { ProjectRepository } from "./projectRepository";
import { createProjectRepository } from "./projectRepositoryFactory";
```

Change the default parameter:

```ts
export async function getProjectProgress(
  today = new Date().toISOString().slice(0, 10),
  repository: ProjectRepository = createProjectRepository(),
): Promise<ProjectProgressData> {
```

- [x] **Step 4: Wire admin placeholder**

Modify `web/src/features/project/AdminPlaceholder.tsx`:

```tsx
import { createProjectRepository } from "../../services/projectRepositoryFactory";
import { AdminPage } from "./AdminPage";
import { getCurrentDateString } from "./DashboardPage";

export function AdminPlaceholder() {
  return <AdminPage repository={createProjectRepository()} today={getCurrentDateString()} />;
}
```

- [x] **Step 5: Run targeted tests**

Run:

```bash
cd web && npm test -- src/services/projectService.test.ts src/features/project/AdminPage.test.tsx
```

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add web/src/services/projectService.ts web/src/features/project/AdminPlaceholder.tsx web/src/services/projectService.test.ts web/src/features/project/AdminPage.test.tsx
git commit -m "feat: wire repository factory into app"
```

## Task 5: Configuration And Documentation

**Files:**
- Create: `web/.env.example`
- Modify: `.gitignore`
- Modify: `web/README.md`
- Modify: `00_AI协作工作区/03_版本迭代/VERSION.md`
- Modify: `00_AI协作工作区/03_版本迭代/CHANGELOG.md`

- [x] **Step 1: Add placeholder env example**

Create `web/.env.example`:

```dotenv
# local keeps the app on mock/localStorage data. cloudbase enables CloudBase Web SDK.
VITE_PROJECT_DATA_SOURCE=local

# CloudBase Web SDK public config. Do not place secretId or secretKey in frontend env.
VITE_CLOUDBASE_ENV_ID=
VITE_CLOUDBASE_ACCESS_KEY=
VITE_CLOUDBASE_PROJECT_ID=cpid710r8
VITE_CLOUDBASE_PROJECTS_COLLECTION=projects
VITE_CLOUDBASE_TASKS_COLLECTION=project_tasks
```

- [x] **Step 2: Verify ignore rules**

Confirm `.gitignore` keeps `.env` and `.env.*` ignored while allowing `.env.example`:

```gitignore
.env
.env.*
!.env.example
```

If these lines are already present, do not change the file.

- [x] **Step 3: Update README CloudBase docs**

Replace the stale Data Source Boundary and CloudBase sections in `web/README.md` with:

```md
## Data Source Boundary

The UI reads and writes project progress data through `src/services/projectService.ts`,
`src/services/projectAdminService.ts`, and the `ProjectRepository` interface in
`src/services/projectRepository.ts`.

Available repository implementations:

- `LocalProjectRepository`: mock/localStorage-backed data for development, review, and demo.
- `CloudBaseProjectRepository`: Tencent CloudBase-backed project metadata and task data.

React components must not import CloudBase SDK directly.

## CloudBase Configuration

Copy `web/.env.example` to a local `.env` file when configuring CloudBase. Keep real
values out of Git.

Required frontend-safe variables for CloudBase mode:

- `VITE_PROJECT_DATA_SOURCE=cloudbase`
- `VITE_CLOUDBASE_ENV_ID`
- `VITE_CLOUDBASE_ACCESS_KEY` for the Web SDK Publishable Key when required
- `VITE_CLOUDBASE_PROJECT_ID`
- `VITE_CLOUDBASE_PROJECTS_COLLECTION`
- `VITE_CLOUDBASE_TASKS_COLLECTION`

Do not add `secretId`, `secretKey`, or other server-side credentials to Vite frontend
environment variables. Browser direct access also requires CloudBase console setup for
allowed origins or security domains, authentication mode, and database permission rules
before enabling write access.

When CloudBase config is absent or `VITE_PROJECT_DATA_SOURCE=local`, the app falls back
to local data and does not require CloudBase credentials.

## CloudBase Verification

Before production deployment:

1. Configure CloudBase allowed origins/security domains for the deployed website.
2. Configure authentication and database permission rules for project reads and admin writes.
3. Set the Vite variables in the deployment platform.
4. Use non-sensitive test data to confirm project read, task update, archive, and restore
   behavior from `/admin`.
```

- [x] **Step 4: Update version records**

Append a CloudBase persistence entry to `00_AI协作工作区/03_版本迭代/CHANGELOG.md` and update
`00_AI协作工作区/03_版本迭代/VERSION.md` according to the existing format. Include:

- CloudBase repository adapter and data source switching.
- Secret-safe frontend config boundary.
- Local fallback behavior.
- Real CloudBase verification deferred until user provides environment details.

- [x] **Step 5: Commit**

```bash
git add .gitignore web/.env.example web/README.md 00_AI协作工作区/03_版本迭代/VERSION.md 00_AI协作工作区/03_版本迭代/CHANGELOG.md
git commit -m "docs: document cloudbase persistence config"
```

## Task 6: Full Verification And OpenSpec Task Sync

**Files:**
- Modify: `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/cloudbase-persistence/tasks.md`

- [x] **Step 1: Run full tests**

Run:

```bash
cd web && npm test
```

Expected: all test files PASS.

- [x] **Step 2: Run production build**

Run:

```bash
cd web && npm run build
```

Expected: TypeScript and Vite build PASS.

- [x] **Step 3: Validate OpenSpec change**

Run:

```bash
cd 00_AI协作工作区/05_Comet工作区/codex-openspec && openspec validate cloudbase-persistence --strict
```

Expected: change is valid.

- [x] **Step 4: Check off OpenSpec tasks**

Update `openspec/changes/cloudbase-persistence/tasks.md` to check all completed items. For 4.2 and 4.3, record that real read/write verification is prepared but deferred until the user provides CloudBase environment details.

- [x] **Step 5: Commit task sync**

```bash
git add 00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/cloudbase-persistence/tasks.md
git commit -m "docs: mark cloudbase persistence tasks complete"
```

## Self-Review

- Spec coverage: Tasks 1-2 cover schema, mapping, repository reads/writes, and admin semantics. Task 3 covers data source switching and secret-safe config rejection. Task 5 covers environment documentation and CloudBase browser safety prerequisites. Task 6 covers verification and OpenSpec task sync.
- Placeholder scan: No TBD/TODO placeholders remain. Real CloudBase credentials are explicitly excluded.
- Type consistency: The plan uses the existing `ProjectRepository`, `Project`, `ProjectTaskInput`, and `ListTaskOptions` names. New CloudBase client abstractions are defined before use.
