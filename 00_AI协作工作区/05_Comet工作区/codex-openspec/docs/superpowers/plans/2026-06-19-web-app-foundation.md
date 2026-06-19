---
change: web-app-foundation
design-doc: docs/superpowers/specs/2026-06-19-web-app-foundation-design.md
base-ref: no-git-repo-before-implementation
archived-with: 2026-06-19-web-app-foundation
---

# Web App Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the React + Vite + TypeScript foundation for the CPID710R8 project management website with mock project data, a typed data access boundary, and placeholder admin routing.

**Architecture:** Create a `web/` static SPA that uses typed project progress models, mock data, derived progress utilities, and a repository/service layer. The UI proves data loading through the service contract and leaves dashboard, real admin editing, CloudBase persistence, and deployment for later changes.

**Tech Stack:** React, Vite, TypeScript, Vitest, React Testing Library, CSS modules or plain CSS, npm scripts.

archived-with: 2026-06-19-web-app-foundation
---

## File Structure

- Create `web/package.json`: frontend scripts and dependencies.
- Create `web/index.html`, `web/vite.config.ts`, `web/tsconfig.json`, `web/tsconfig.node.json`: Vite and TypeScript configuration.
- Create `web/src/main.tsx`: React root bootstrap.
- Create `web/src/app/App.tsx`: hash-based route switch for `/` and `/admin`.
- Create `web/src/app/App.test.tsx`: route smoke tests.
- Create `web/src/types/project.ts`: domain model types.
- Create `web/src/utils/progress.ts`: date, duration, progress, warning helpers.
- Create `web/src/utils/progress.test.ts`: focused helper tests.
- Create `web/src/data/cpid710r8Mock.ts`: structured mock data based on the current Excel workbook.
- Create `web/src/services/projectRepository.ts`: repository interface and mock implementation.
- Create `web/src/services/projectService.ts`: service functions and derived task projection.
- Create `web/src/services/projectService.test.ts`: data access and mapping tests.
- Create `web/src/features/project/FoundationPage.tsx`: minimal project data display page.
- Create `web/src/features/project/AdminPlaceholder.tsx`: `/admin` placeholder page with no edit capability.
- Create `web/src/styles.css`: restrained baseline layout styles.
- Modify `00_AI协作工作区/03_版本迭代/VERSION.md`: record first functional implementation version.
- Modify `00_AI协作工作区/03_版本迭代/CHANGELOG.md`: record implemented foundation and verification results.

### Task 1: Scaffold Vite React TypeScript App

**Files:**
- Create: `web/package.json`
- Create: `web/index.html`
- Create: `web/vite.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/tsconfig.node.json`
- Create: `web/src/main.tsx`
- Create: `web/src/app/App.tsx`
- Create: `web/src/styles.css`

- [x] **Step 1: Create package and config files**

Create `web/package.json`:

```json
{
  "name": "cpid710r8-project-web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "vitest": "latest"
  }
}
```

Create `web/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CPID710R8 项目进度管理</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `web/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

Create `web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `web/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [x] **Step 2: Create React root and placeholder app**

Create `web/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `web/src/app/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <h1>CPID710R8 项目进度管理</h1>
      <p>项目网站基础工程正在运行。</p>
    </main>
  );
}
```

Create `web/src/styles.css`:

```css
:root {
  color: #17202a;
  background: #f6f8fb;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

.app-shell {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 32px;
}
```

- [x] **Step 3: Install dependencies**

Run:

```bash
cd web
npm install
```

Expected: dependencies install and `web/package-lock.json` is created.

- [x] **Step 4: Build scaffold**

Run:

```bash
cd web
npm run build
```

Expected: TypeScript and Vite build succeed and `web/dist/` is created.

### Task 2: Define Project Domain Model and Progress Utilities

**Files:**
- Create: `web/src/types/project.ts`
- Create: `web/src/utils/progress.ts`
- Create: `web/src/utils/progress.test.ts`
- Create: `web/src/test/setup.ts`

- [x] **Step 1: Add test setup**

Create `web/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [x] **Step 2: Write failing progress utility tests**

Create `web/src/utils/progress.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  calculateCalendarDays,
  calculateCompletionRatio,
  getWarningState,
} from "./progress";

describe("progress utilities", () => {
  it("calculates inclusive calendar days", () => {
    expect(calculateCalendarDays("2026-03-30", "2026-04-19")).toBe(21);
  });

  it("caps in-progress completion at 99 percent when elapsed exceeds planned duration", () => {
    expect(calculateCompletionRatio({ plannedDurationDays: 12, elapsedDays: 15, isFinished: false })).toBe(0.99);
  });

  it("marks tasks due within a week", () => {
    expect(getWarningState({ today: "2026-06-19", plannedEndDate: "2026-06-21" })).toBe("within-week");
  });
});
```

- [x] **Step 3: Run utility tests and verify failure**

Run:

```bash
cd web
npm test -- src/utils/progress.test.ts
```

Expected: FAIL because `progress.ts` does not exist.

- [x] **Step 4: Implement domain types**

Create `web/src/types/project.ts`:

```ts
export type WarningState = "none" | "due-today" | "within-week" | "future" | "overdue";

export interface Project {
  id: string;
  name: string;
  plannedStartDate: string;
  plannedEndDate: string;
  calendarMode: "calendar-days" | "workdays";
}

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
}

export interface ProjectTask extends ProjectTaskInput {
  plannedDurationDays: number;
  actualDurationDays?: number;
  elapsedDays: number | "not-started" | "finished";
  completionRatio: number;
  overdueDays?: number;
  warningState: WarningState;
}

export interface ProjectProgressData {
  project: Project;
  tasks: ProjectTask[];
}
```

- [x] **Step 5: Implement progress utilities**

Create `web/src/utils/progress.ts`:

```ts
import type { WarningState } from "../types/project";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function calculateCalendarDays(startDate: string, endDate: string): number {
  return Math.floor((toUtcDate(endDate).getTime() - toUtcDate(startDate).getTime()) / MS_PER_DAY) + 1;
}

export function calculateCompletionRatio({
  plannedDurationDays,
  elapsedDays,
  isFinished,
}: {
  plannedDurationDays: number;
  elapsedDays: number;
  isFinished: boolean;
}): number {
  if (isFinished) return 1;
  if (plannedDurationDays <= 0 || elapsedDays <= 0) return 0;
  if (elapsedDays >= plannedDurationDays) return 0.99;
  return Math.min(elapsedDays / plannedDurationDays, 1);
}

export function getWarningState({
  today,
  plannedEndDate,
}: {
  today: string;
  plannedEndDate: string;
}): WarningState {
  const diff = Math.floor((toUtcDate(plannedEndDate).getTime() - toUtcDate(today).getTime()) / MS_PER_DAY);
  if (diff < 0) return "overdue";
  if (diff === 0) return "due-today";
  if (diff <= 7) return "within-week";
  return "future";
}
```

- [x] **Step 6: Run utility tests and verify pass**

Run:

```bash
cd web
npm test -- src/utils/progress.test.ts
```

Expected: PASS.

### Task 3: Add CPID710R8 Mock Data and Service Boundary

**Files:**
- Create: `web/src/data/cpid710r8Mock.ts`
- Create: `web/src/services/projectRepository.ts`
- Create: `web/src/services/projectService.ts`
- Create: `web/src/services/projectService.test.ts`

- [x] **Step 1: Write failing service tests**

Create `web/src/services/projectService.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getProjectProgress } from "./projectService";

describe("project service", () => {
  it("loads CPID710R8 mock project data through the service boundary", async () => {
    const data = await getProjectProgress();

    expect(data.project.name).toContain("CPID710R8");
    expect(data.tasks.length).toBeGreaterThan(0);
    expect(data.tasks[0]).toMatchObject({
      id: "M1-001",
      milestoneCode: "M1",
      taskName: "硬件架构选型+关键器件确认",
      plannedDurationDays: 21,
      resourceOwner: "芯联",
      responsiblePerson: "周伟松/唐凯",
    });
  });

  it("derives warning and completion fields from task input", async () => {
    const data = await getProjectProgress("2026-06-19");
    const activeTask = data.tasks.find((task) => task.id === "M5-002");

    expect(activeTask?.completionRatio).toBe(0.99);
    expect(activeTask?.warningState).toBe("overdue");
  });
});
```

- [x] **Step 2: Run service tests and verify failure**

Run:

```bash
cd web
npm test -- src/services/projectService.test.ts
```

Expected: FAIL because service and mock data files do not exist.

- [x] **Step 3: Create mock data input**

Create `web/src/data/cpid710r8Mock.ts`:

```ts
import type { Project, ProjectTaskInput } from "../types/project";

export const cpid710r8Project: Project = {
  id: "cpid710r8",
  name: "CPID710R8 Check Point 定制读写器 - 开发进度管理",
  plannedStartDate: "2026-03-30",
  plannedEndDate: "2026-09-28",
  calendarMode: "calendar-days",
};

export const cpid710r8TaskInputs: ProjectTaskInput[] = [
  {
    id: "M1-001",
    milestoneCode: "M1",
    projectContent: "硬件方案确定",
    taskName: "硬件架构选型+关键器件确认",
    plannedStartDate: "2026-03-30",
    plannedEndDate: "2026-04-19",
    actualStartDate: "2026-03-30",
    actualEndDate: "2026-04-19",
    resourceOwner: "芯联",
    responsiblePerson: "周伟松/唐凯",
  },
  {
    id: "M5-002",
    milestoneCode: "M5",
    projectContent: "V1.0 PCBA打样",
    taskName: "PCB板/屏蔽盖/物料",
    plannedStartDate: "2026-06-05",
    plannedEndDate: "2026-06-16",
    actualStartDate: "2026-06-05",
    resourceOwner: "芯联",
    responsiblePerson: "林泳钦",
  },
  {
    id: "M6-001",
    milestoneCode: "M6",
    projectContent: "测试固件&驱动开发",
    taskName: "完成单片机测试固件",
    plannedStartDate: "2026-06-15",
    plannedEndDate: "2026-06-21",
    resourceOwner: "芯联",
    responsiblePerson: "邹青",
  },
];
```

- [x] **Step 4: Create repository and service**

Create `web/src/services/projectRepository.ts`:

```ts
import { cpid710r8Project, cpid710r8TaskInputs } from "../data/cpid710r8Mock";
import type { Project, ProjectTaskInput } from "../types/project";

export interface ProjectRepository {
  getProject(): Promise<Project>;
  listTaskInputs(): Promise<ProjectTaskInput[]>;
}

export class MockProjectRepository implements ProjectRepository {
  async getProject(): Promise<Project> {
    return cpid710r8Project;
  }

  async listTaskInputs(): Promise<ProjectTaskInput[]> {
    return cpid710r8TaskInputs;
  }
}
```

Create `web/src/services/projectService.ts`:

```ts
import type { ProjectProgressData, ProjectTask, ProjectTaskInput } from "../types/project";
import {
  calculateCalendarDays,
  calculateCompletionRatio,
  getWarningState,
} from "../utils/progress";
import { MockProjectRepository, type ProjectRepository } from "./projectRepository";

function deriveTask(input: ProjectTaskInput, today: string): ProjectTask {
  const plannedDurationDays = calculateCalendarDays(input.plannedStartDate, input.plannedEndDate);
  const isFinished = Boolean(input.actualEndDate);
  const actualDurationDays =
    input.actualStartDate && input.actualEndDate
      ? calculateCalendarDays(input.actualStartDate, input.actualEndDate)
      : undefined;
  const elapsedDays = isFinished
    ? "finished"
    : input.actualStartDate
      ? calculateCalendarDays(input.actualStartDate, today)
      : "not-started";
  const numericElapsedDays = typeof elapsedDays === "number" ? elapsedDays : 0;
  const completionRatio = calculateCompletionRatio({
    plannedDurationDays,
    elapsedDays: numericElapsedDays,
    isFinished,
  });
  const overdueDays =
    !isFinished && getWarningState({ today, plannedEndDate: input.plannedEndDate }) === "overdue"
      ? Math.max(calculateCalendarDays(input.plannedEndDate, today) - 1, 0)
      : undefined;

  return {
    ...input,
    plannedDurationDays,
    actualDurationDays,
    elapsedDays,
    completionRatio,
    overdueDays,
    warningState: getWarningState({ today, plannedEndDate: input.plannedEndDate }),
  };
}

export async function getProjectProgress(
  today = "2026-06-19",
  repository: ProjectRepository = new MockProjectRepository(),
): Promise<ProjectProgressData> {
  const [project, taskInputs] = await Promise.all([repository.getProject(), repository.listTaskInputs()]);

  return {
    project,
    tasks: taskInputs.map((task) => deriveTask(task, today)),
  };
}
```

- [x] **Step 5: Run service tests and verify pass**

Run:

```bash
cd web
npm test -- src/services/projectService.test.ts
```

Expected: PASS.

### Task 4: Build Foundation Pages and Routing

**Files:**
- Modify: `web/src/app/App.tsx`
- Create: `web/src/app/App.test.tsx`
- Create: `web/src/features/project/FoundationPage.tsx`
- Create: `web/src/features/project/AdminPlaceholder.tsx`
- Modify: `web/src/styles.css`

- [x] **Step 1: Write failing app route tests**

Create `web/src/app/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("App routing", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the project foundation page", async () => {
    window.history.pushState({}, "", "/");
    render(<App />);

    expect(await screen.findByText(/CPID710R8 Check Point/)).toBeInTheDocument();
    expect(screen.getByText("硬件架构选型+关键器件确认")).toBeInTheDocument();
  });

  it("renders admin placeholder without edit controls", () => {
    window.history.pushState({}, "", "/admin");
    render(<App />);

    expect(screen.getByRole("heading", { name: "后台维护占位" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /保存|编辑|新增/ })).not.toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run route tests and verify failure**

Run:

```bash
cd web
npm test -- src/app/App.test.tsx
```

Expected: FAIL because pages and routing are not implemented.

- [x] **Step 3: Implement foundation and admin pages**

Create `web/src/features/project/FoundationPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { getProjectProgress } from "../../services/projectService";
import type { ProjectProgressData } from "../../types/project";

export function FoundationPage() {
  const [data, setData] = useState<ProjectProgressData | null>(null);

  useEffect(() => {
    void getProjectProgress().then(setData);
  }, []);

  if (!data) {
    return <p>正在加载项目数据...</p>;
  }

  return (
    <section className="page-stack">
      <header>
        <p className="eyebrow">项目基础数据</p>
        <h1>{data.project.name}</h1>
        <p>
          计划周期：{data.project.plannedStartDate} 至 {data.project.plannedEndDate}
        </p>
      </header>

      <div className="summary-strip">
        <span>任务数：{data.tasks.length}</span>
        <span>数据源：Mock</span>
        <span>日历口径：自然日</span>
      </div>

      <table className="task-table">
        <thead>
          <tr>
            <th>编号</th>
            <th>项目内容</th>
            <th>进度名称</th>
            <th>计划周期</th>
            <th>完成比例</th>
            <th>责任人</th>
          </tr>
        </thead>
        <tbody>
          {data.tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.milestoneCode}</td>
              <td>{task.projectContent}</td>
              <td>{task.taskName}</td>
              <td>
                {task.plannedStartDate} 至 {task.plannedEndDate}
              </td>
              <td>{Math.round(task.completionRatio * 100)}%</td>
              <td>{task.responsiblePerson}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

Create `web/src/features/project/AdminPlaceholder.tsx`:

```tsx
export function AdminPlaceholder() {
  return (
    <section className="page-stack">
      <p className="eyebrow">Admin</p>
      <h1>后台维护占位</h1>
      <p>
        项目内容和进度维护能力将在 admin-progress-backend change 中实现。当前页面只用于稳定路由和工程边界。
      </p>
      <a href="/">返回项目基础页</a>
    </section>
  );
}
```

- [x] **Step 4: Implement simple routing**

Replace `web/src/app/App.tsx`:

```tsx
import { AdminPlaceholder } from "../features/project/AdminPlaceholder";
import { FoundationPage } from "../features/project/FoundationPage";

function getPathname() {
  return window.location.pathname;
}

export function App() {
  const pathname = getPathname();

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="主导航">
        <a href="/">项目基础</a>
        <a href="/admin">后台占位</a>
      </nav>
      {pathname === "/admin" ? <AdminPlaceholder /> : <FoundationPage />}
    </main>
  );
}
```

Append to `web/src/styles.css`:

```css
.top-nav {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.top-nav a {
  color: #145ea8;
  font-weight: 700;
  text-decoration: none;
}

.page-stack {
  display: grid;
  gap: 20px;
  max-width: 1180px;
}

.eyebrow {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 8px;
  text-transform: uppercase;
}

.summary-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.summary-strip span {
  background: #e9eef5;
  border: 1px solid #d5deea;
  border-radius: 6px;
  padding: 8px 10px;
}

.task-table {
  border-collapse: collapse;
  width: 100%;
}

.task-table th,
.task-table td {
  border: 1px solid #d9e2ec;
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

.task-table th {
  background: #dfe8f5;
}
```

- [x] **Step 5: Run route tests and verify pass**

Run:

```bash
cd web
npm test -- src/app/App.test.tsx
```

Expected: PASS.

### Task 5: Verification and Version Records

**Files:**
- Modify: `00_AI协作工作区/03_版本迭代/VERSION.md`
- Modify: `00_AI协作工作区/03_版本迭代/CHANGELOG.md`
- Modify: `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/web-app-foundation/tasks.md`

- [x] **Step 1: Run full test suite**

Run:

```bash
cd web
npm test
```

Expected: PASS.

- [x] **Step 2: Run production build**

Run:

```bash
cd web
npm run build
```

Expected: PASS and `web/dist/` exists.

- [x] **Step 3: Update OpenSpec task checklist**

Modify `openspec/changes/web-app-foundation/tasks.md` so all tasks completed by this implementation are checked with `- [x]`.

- [x] **Step 4: Update version file**

Modify `00_AI协作工作区/03_版本迭代/VERSION.md` to add:

```markdown
## 业务功能版本

- `web-app-foundation`: `v1.0`
```

If the section already exists, update or append the `web-app-foundation` line without removing existing entries.

- [x] **Step 5: Update changelog**

Append to `00_AI协作工作区/03_版本迭代/CHANGELOG.md`:

```markdown
## web-app-foundation v1.0 - 2026-06-19

- 新增 React + Vite + TypeScript 网站基础工程。
- 新增 CPID710R8 项目进度领域模型、mock 数据和数据访问服务。
- 新增项目基础展示页与 `/admin` 后台占位路由。
- 验证：`npm test` 通过。
- 验证：`npm run build` 通过。
- 可交给 Claude Code 审查：是。
```

- [x] **Step 6: Final status note**

In the final response, explicitly tell the user:

```text
当前 web-app-foundation v1.0 已可交给 Claude Code 审查。
```
