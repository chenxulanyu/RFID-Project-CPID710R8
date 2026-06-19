---
change: project-dashboard-frontend
design-doc: docs/superpowers/specs/2026-06-19-project-dashboard-frontend-design.md
base-ref: 1588b0728c331f05c398d188e2ebb71aa2ffc09e
---

# Project Dashboard Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the CPID710R8 project dashboard with top-level KPIs, risk task strip, task detail table, lightweight timeline, and mobile landscape guidance.

**Architecture:** Keep data derivation in pure functions and UI components focused on rendering. `DashboardPage` owns data loading; `dashboardMetrics.ts` derives status, KPIs, risks, and timeline positions; presentational components render summary, risks, table, timeline, and portrait mobile guidance. Existing `getProjectProgress` remains the data boundary.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Testing Library, CSS.

---

## File Structure

- Modify `web/src/app/App.tsx`: change the main `/` route to render `DashboardPage` while preserving `/admin`.
- Create `web/src/features/project/dashboardMetrics.ts`: pure derivation for dashboard status, metrics, risk tasks, and timeline geometry.
- Create `web/src/features/project/dashboardMetrics.test.ts`: TDD tests for delayed start, counts, progress, warnings, and timeline range.
- Create `web/src/features/project/DashboardPage.tsx`: data loading, current-date injection, landscape gate wrapping, dashboard composition.
- Create `web/src/features/project/DashboardPage.test.tsx`: page rendering, risk visibility, portrait guidance behavior.
- Create `web/src/features/project/ProjectSummaryDashboard.tsx`: project header and KPI cards.
- Create `web/src/features/project/RiskTaskStrip.tsx`: compact horizontal risk list.
- Create `web/src/features/project/TaskDetailTable.tsx`: high-density table with stable wrapping/truncation classes.
- Create `web/src/features/project/ProjectTimeline.tsx`: lightweight Gantt-style planned span view.
- Create `web/src/features/project/LandscapeGate.tsx`: portrait mobile guidance shell.
- Modify `web/src/styles.css`: dashboard layout, KPI cards, risk tags, table, timeline, responsive/overflow safeguards.
- Modify `00_AI协作工作区/03_版本迭代/VERSION.md`: update `project-dashboard-frontend` business version.
- Modify `00_AI协作工作区/03_版本迭代/CHANGELOG.md`: record dashboard implementation, tests, build, and visual overflow constraints.
- Modify `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/project-dashboard-frontend/tasks.md`: check off tasks as they complete.

## Task 1: Dashboard Metrics

**Files:**
- Create: `web/src/features/project/dashboardMetrics.ts`
- Create: `web/src/features/project/dashboardMetrics.test.ts`
- Modify: `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/project-dashboard-frontend/tasks.md`

- [x] **Step 1: Write failing status and metrics tests**

Create `web/src/features/project/dashboardMetrics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Project, ProjectTask } from "../../types/project";
import { buildDashboardModel } from "./dashboardMetrics";

const project: Project = {
  id: "cpid710r8",
  name: "CPID710R8 Check Point 定制读写器 - 开发进度管理",
  plannedStartDate: "2026-03-30",
  plannedEndDate: "2026-09-28",
  calendarMode: "calendar-days",
};

function task(overrides: Partial<ProjectTask> & Pick<ProjectTask, "id" | "taskName">): ProjectTask {
  return {
    id: overrides.id,
    milestoneCode: overrides.milestoneCode ?? "M1",
    projectContent: overrides.projectContent ?? "测试项目内容",
    taskName: overrides.taskName,
    plannedStartDate: overrides.plannedStartDate ?? "2026-06-01",
    plannedEndDate: overrides.plannedEndDate ?? "2026-06-10",
    actualStartDate: overrides.actualStartDate,
    actualEndDate: overrides.actualEndDate,
    resourceOwner: overrides.resourceOwner ?? "芯联",
    responsiblePerson: overrides.responsiblePerson ?? "负责人",
    remarks: overrides.remarks,
    plannedDurationDays: overrides.plannedDurationDays ?? 10,
    actualDurationDays: overrides.actualDurationDays,
    elapsedDays: overrides.elapsedDays ?? "not-started",
    completionRatio: overrides.completionRatio ?? 0,
    overdueDays: overrides.overdueDays,
    warningState: overrides.warningState ?? "future",
  };
}

describe("dashboardMetrics", () => {
  it("derives task status counts including delayed starts", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({ id: "done", taskName: "已完成", actualEndDate: "2026-06-03", completionRatio: 1, warningState: "none", elapsedDays: "finished" }),
        task({ id: "active", taskName: "进行中", actualStartDate: "2026-06-01", completionRatio: 0.8, warningState: "within-week", elapsedDays: 19 }),
        task({ id: "late-start", taskName: "延迟启动", plannedStartDate: "2026-06-10", plannedEndDate: "2026-06-25", warningState: "future" }),
        task({ id: "future", taskName: "未来未开始", plannedStartDate: "2026-07-01", plannedEndDate: "2026-07-05", warningState: "future" }),
      ],
    });

    expect(model.metrics.totalTasks).toBe(4);
    expect(model.metrics.finishedTasks).toBe(1);
    expect(model.metrics.inProgressTasks).toBe(1);
    expect(model.metrics.startDelayedTasks).toBe(1);
    expect(model.metrics.notStartedTasks).toBe(1);
    expect(model.tasks.find((item) => item.id === "late-start")?.dashboardStatus).toBe("start-delayed");
  });

  it("collects risk tasks and timeline ranges", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({ id: "overdue", taskName: "延期任务", plannedStartDate: "2026-06-01", plannedEndDate: "2026-06-10", actualStartDate: "2026-06-01", warningState: "overdue", overdueDays: 9, completionRatio: 0.99, elapsedDays: 19 }),
        task({ id: "due", taskName: "今日到期", plannedStartDate: "2026-06-15", plannedEndDate: "2026-06-19", actualStartDate: "2026-06-15", warningState: "due-today", completionRatio: 0.8, elapsedDays: 5 }),
        task({ id: "ok", taskName: "正常任务", plannedStartDate: "2026-08-01", plannedEndDate: "2026-08-05", warningState: "future" }),
      ],
    });

    expect(model.metrics.overdueTasks).toBe(1);
    expect(model.metrics.dueTodayTasks).toBe(1);
    expect(model.riskTasks.map((item) => item.id)).toEqual(["overdue", "due"]);
    expect(model.timelineRange.startDate).toBe("2026-03-30");
    expect(model.timelineRange.endDate).toBe("2026-09-28");
    expect(model.tasks.find((item) => item.id === "overdue")?.timeline.leftPercent).toBeGreaterThanOrEqual(0);
    expect(model.tasks.find((item) => item.id === "overdue")?.timeline.widthPercent).toBeGreaterThan(0);
  });
});
```

- [x] **Step 2: Run metric test to verify RED**

Run:

```bash
cd web
npm test -- src/features/project/dashboardMetrics.test.ts
```

Expected: FAIL because `dashboardMetrics.ts` does not exist.

- [x] **Step 3: Implement dashboard metrics**

Create `web/src/features/project/dashboardMetrics.ts`:

```ts
import type { Project, ProjectTask, WarningState } from "../../types/project";
import { calculateCalendarDays } from "../../utils/progress";

export type DashboardTaskStatus = "finished" | "in-progress" | "start-delayed" | "not-started";

export interface DashboardTask extends ProjectTask {
  dashboardStatus: DashboardTaskStatus;
  statusLabel: string;
  riskLabel?: string;
  timeline: {
    leftPercent: number;
    widthPercent: number;
  };
}

export interface DashboardMetrics {
  totalTasks: number;
  finishedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  startDelayedTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  withinWeekTasks: number;
  overallProgress: number;
}

export interface DashboardModel {
  project: Project;
  today: string;
  metrics: DashboardMetrics;
  riskTasks: DashboardTask[];
  tasks: DashboardTask[];
  timelineRange: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
}

function compareDate(left: string, right: string): number {
  return left.localeCompare(right);
}

export function getDashboardStatus(task: ProjectTask, today: string): DashboardTaskStatus {
  if (task.actualEndDate) return "finished";
  if (task.actualStartDate) return "in-progress";
  if (compareDate(task.plannedStartDate, today) < 0) return "start-delayed";
  return "not-started";
}

function getStatusLabel(status: DashboardTaskStatus): string {
  const labels: Record<DashboardTaskStatus, string> = {
    finished: "已完成",
    "in-progress": "进行中",
    "start-delayed": "延迟启动",
    "not-started": "未开始",
  };
  return labels[status];
}

function getRiskLabel(task: ProjectTask, status: DashboardTaskStatus): string | undefined {
  if (task.warningState === "overdue") return `延期${task.overdueDays ?? 0}天`;
  if (task.warningState === "due-today") return "今日到期";
  if (task.warningState === "within-week") return "7日内到期";
  if (status === "start-delayed") return "延迟启动";
  return undefined;
}

function isRiskTask(task: ProjectTask, status: DashboardTaskStatus): boolean {
  return task.warningState === "overdue" || task.warningState === "due-today" || task.warningState === "within-week" || status === "start-delayed";
}

function clampPercent(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

function buildTimeline(task: ProjectTask, rangeStart: string, totalDays: number) {
  const offsetDays = Math.max(calculateCalendarDays(rangeStart, task.plannedStartDate) - 1, 0);
  const durationDays = Math.max(task.plannedDurationDays, 1);
  return {
    leftPercent: clampPercent((offsetDays / totalDays) * 100),
    widthPercent: clampPercent((durationDays / totalDays) * 100),
  };
}

export function buildDashboardModel({
  project,
  tasks,
  today,
}: {
  project: Project;
  tasks: ProjectTask[];
  today: string;
}): DashboardModel {
  const totalDays = Math.max(calculateCalendarDays(project.plannedStartDate, project.plannedEndDate), 1);
  const dashboardTasks = tasks.map((task) => {
    const dashboardStatus = getDashboardStatus(task, today);
    return {
      ...task,
      dashboardStatus,
      statusLabel: getStatusLabel(dashboardStatus),
      riskLabel: getRiskLabel(task, dashboardStatus),
      timeline: buildTimeline(task, project.plannedStartDate, totalDays),
    };
  });

  const metrics: DashboardMetrics = {
    totalTasks: dashboardTasks.length,
    finishedTasks: dashboardTasks.filter((task) => task.dashboardStatus === "finished").length,
    inProgressTasks: dashboardTasks.filter((task) => task.dashboardStatus === "in-progress").length,
    notStartedTasks: dashboardTasks.filter((task) => task.dashboardStatus === "not-started").length,
    startDelayedTasks: dashboardTasks.filter((task) => task.dashboardStatus === "start-delayed").length,
    overdueTasks: dashboardTasks.filter((task) => task.warningState === "overdue").length,
    dueTodayTasks: dashboardTasks.filter((task) => task.warningState === "due-today").length,
    withinWeekTasks: dashboardTasks.filter((task) => task.warningState === "within-week").length,
    overallProgress: dashboardTasks.length
      ? dashboardTasks.reduce((sum, task) => sum + task.completionRatio, 0) / dashboardTasks.length
      : 0,
  };

  return {
    project,
    today,
    metrics,
    riskTasks: dashboardTasks.filter((task) => isRiskTask(task, task.dashboardStatus)),
    tasks: dashboardTasks,
    timelineRange: {
      startDate: project.plannedStartDate,
      endDate: project.plannedEndDate,
      totalDays,
    },
  };
}
```

- [x] **Step 4: Run metric tests to verify GREEN**

Run:

```bash
cd web
npm test -- src/features/project/dashboardMetrics.test.ts
```

Expected: PASS.

- [x] **Step 5: Check off OpenSpec task 1.1 and 1.3**

In `tasks.md`, change:

```md
- [x] 1.1 Implement derived dashboard metrics for task counts, overall progress, overdue tasks, and warning counts.
- [x] 1.3 Verify dashboard metrics match the underlying task data.
```

to:

```md
- [x] 1.1 Implement derived dashboard metrics for task counts, overall progress, overdue tasks, and warning counts.
- [x] 1.3 Verify dashboard metrics match the underlying task data.
```

- [x] **Step 6: Commit metrics**

Run:

```bash
git add web/src/features/project/dashboardMetrics.ts web/src/features/project/dashboardMetrics.test.ts \
  "00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/project-dashboard-frontend/tasks.md"
git commit -m "feat: add project dashboard metrics"
```

## Task 2: Dashboard Page And KPI Summary

**Files:**
- Create: `web/src/features/project/DashboardPage.tsx`
- Create: `web/src/features/project/DashboardPage.test.tsx`
- Create: `web/src/features/project/ProjectSummaryDashboard.tsx`
- Modify: `web/src/app/App.tsx`
- Modify: `web/src/styles.css`
- Modify: `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/project-dashboard-frontend/tasks.md`

- [x] **Step 1: Write failing dashboard render test**

Create `web/src/features/project/DashboardPage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("renders project summary KPI cards", async () => {
    render(<DashboardPage today="2026-06-19" />);

    expect(await screen.findByText(/CPID710R8 Check Point/)).toBeInTheDocument();
    expect(screen.getByText("总体进度")).toBeInTheDocument();
    expect(screen.getByText("任务总数")).toBeInTheDocument();
    expect(screen.getByText("延迟启动")).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run dashboard render test to verify RED**

Run:

```bash
cd web
npm test -- src/features/project/DashboardPage.test.tsx
```

Expected: FAIL because `DashboardPage.tsx` does not exist.

- [x] **Step 3: Implement summary dashboard components**

Create `web/src/features/project/ProjectSummaryDashboard.tsx`:

```tsx
import type { DashboardModel } from "./dashboardMetrics";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function ProjectSummaryDashboard({ model }: { model: DashboardModel }) {
  const { project, metrics, today } = model;
  const riskTotal = metrics.overdueTasks + metrics.dueTodayTasks + metrics.withinWeekTasks;

  return (
    <section className="dashboard-hero" aria-labelledby="dashboard-title">
      <div className="dashboard-title-block">
        <p className="eyebrow">项目总览</p>
        <h1 id="dashboard-title">{project.name}</h1>
        <p className="dashboard-meta">
          计划周期：{project.plannedStartDate} 至 {project.plannedEndDate} · 今日：{today} · 日历口径：自然日
        </p>
      </div>

      <div className="metric-grid" aria-label="项目关键指标">
        <article className="metric-card metric-card-primary">
          <span>总体进度</span>
          <strong>{percent(metrics.overallProgress)}</strong>
        </article>
        <article className="metric-card">
          <span>任务总数</span>
          <strong>{metrics.totalTasks}</strong>
        </article>
        <article className="metric-card">
          <span>已完成</span>
          <strong>{metrics.finishedTasks}</strong>
        </article>
        <article className="metric-card">
          <span>进行中</span>
          <strong>{metrics.inProgressTasks}</strong>
        </article>
        <article className="metric-card metric-card-warning">
          <span>延期/临期</span>
          <strong>{riskTotal}</strong>
        </article>
        <article className="metric-card metric-card-danger">
          <span>延迟启动</span>
          <strong>{metrics.startDelayedTasks}</strong>
        </article>
      </div>
    </section>
  );
}
```

Create `web/src/features/project/DashboardPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { getProjectProgress } from "../../services/projectService";
import type { ProjectProgressData } from "../../types/project";
import { buildDashboardModel, type DashboardModel } from "./dashboardMetrics";
import { ProjectSummaryDashboard } from "./ProjectSummaryDashboard";

function getCurrentDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardPage({ today = getCurrentDateString() }: { today?: string }) {
  const [model, setModel] = useState<DashboardModel | null>(null);

  useEffect(() => {
    void getProjectProgress(today).then((data: ProjectProgressData) => {
      setModel(buildDashboardModel({ project: data.project, tasks: data.tasks, today }));
    });
  }, [today]);

  if (!model) {
    return <p>正在加载项目仪表盘...</p>;
  }

  return (
    <section className="dashboard-page">
      <ProjectSummaryDashboard model={model} />
    </section>
  );
}
```

Modify `web/src/app/App.tsx`:

```tsx
import { AdminPlaceholder } from "../features/project/AdminPlaceholder";
import { DashboardPage } from "../features/project/DashboardPage";

function getPathname() {
  return window.location.pathname;
}

export function App() {
  const pathname = getPathname();

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="主导航">
        <a href="/">项目仪表盘</a>
        <a href="/admin">后台占位</a>
      </nav>
      {pathname === "/admin" ? <AdminPlaceholder /> : <DashboardPage />}
    </main>
  );
}
```

Append dashboard summary styles to `web/src/styles.css`:

```css
.dashboard-page {
  display: grid;
  gap: 18px;
  margin: 0 auto;
  max-width: 1320px;
  min-width: 0;
}

.dashboard-hero {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.dashboard-title-block h1 {
  font-size: clamp(24px, 3vw, 38px);
  line-height: 1.12;
  margin: 0;
  overflow-wrap: anywhere;
}

.dashboard-meta {
  color: #536173;
  margin: 10px 0 0;
  overflow-wrap: anywhere;
}

.metric-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  min-width: 0;
}

.metric-card {
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  box-sizing: border-box;
  min-height: 88px;
  min-width: 0;
  padding: 14px;
}

.metric-card span {
  color: #536173;
  display: block;
  font-size: 13px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.metric-card strong {
  color: #17202a;
  display: block;
  font-size: 30px;
  line-height: 1;
  margin-top: 12px;
}

.metric-card-primary {
  border-color: #6aa3d8;
}

.metric-card-warning {
  border-color: #e0b341;
}

.metric-card-danger {
  border-color: #db6b5f;
}
```

- [x] **Step 4: Run dashboard render test to verify GREEN**

Run:

```bash
cd web
npm test -- src/features/project/DashboardPage.test.tsx
```

Expected: PASS.

- [x] **Step 5: Update App smoke test expectation**

Modify `web/src/app/App.test.tsx` so the main route expects the dashboard nav/text:

```tsx
expect(await screen.findByText(/CPID710R8 Check Point/)).toBeInTheDocument();
expect(screen.getByText("总体进度")).toBeInTheDocument();
```

Run:

```bash
cd web
npm test -- src/app/App.test.tsx
```

Expected: PASS.

- [x] **Step 6: Check off OpenSpec task 1.2**

In `tasks.md`, change:

```md
- [x] 1.2 Build the project summary dashboard section with project period, duration, elapsed days, and progress indicators.
```

to:

```md
- [x] 1.2 Build the project summary dashboard section with project period, duration, elapsed days, and progress indicators.
```

- [x] **Step 7: Commit dashboard summary**

Run:

```bash
git add web/src/app/App.tsx web/src/app/App.test.tsx web/src/features/project/DashboardPage.tsx \
  web/src/features/project/DashboardPage.test.tsx web/src/features/project/ProjectSummaryDashboard.tsx \
  web/src/styles.css "00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/project-dashboard-frontend/tasks.md"
git commit -m "feat: add project dashboard summary"
```

## Task 3: Risk Strip And Task Detail Table

**Files:**
- Create: `web/src/features/project/RiskTaskStrip.tsx`
- Create: `web/src/features/project/TaskDetailTable.tsx`
- Modify: `web/src/features/project/DashboardPage.tsx`
- Modify: `web/src/features/project/DashboardPage.test.tsx`
- Modify: `web/src/styles.css`
- Modify: `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/project-dashboard-frontend/tasks.md`

- [x] **Step 1: Extend failing test for risks and table**

Append to `DashboardPage.test.tsx`:

```tsx
it("renders risk tasks and task detail fields", async () => {
  render(<DashboardPage today="2026-06-19" />);

  expect(await screen.findByText("风险任务")).toBeInTheDocument();
  expect(screen.getByText("PCB板/屏蔽盖/物料")).toBeInTheDocument();
  expect(screen.getByText("延期3天")).toBeInTheDocument();
  expect(screen.getByText("完成单片机测试固件")).toBeInTheDocument();
  expect(screen.getAllByText("延迟启动").length).toBeGreaterThan(0);
});
```

- [x] **Step 2: Run test to verify RED**

Run:

```bash
cd web
npm test -- src/features/project/DashboardPage.test.tsx
```

Expected: FAIL because risk/table components are not rendered.

- [x] **Step 3: Implement risk strip and table**

Create `web/src/features/project/RiskTaskStrip.tsx`:

```tsx
import type { DashboardTask } from "./dashboardMetrics";

export function RiskTaskStrip({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <section className="risk-strip" aria-labelledby="risk-strip-title">
      <div className="section-heading-row">
        <h2 id="risk-strip-title">风险任务</h2>
        <span>{tasks.length} 项需关注</span>
      </div>
      {tasks.length ? (
        <div className="risk-list">
          {tasks.map((task) => (
            <article className={`risk-pill status-${task.dashboardStatus} warning-${task.warningState}`} key={task.id}>
              <strong>{task.milestoneCode}</strong>
              <span>{task.taskName}</span>
              <em>{task.riskLabel}</em>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">当前没有延期、临期或延迟启动任务。</p>
      )}
    </section>
  );
}
```

Create `web/src/features/project/TaskDetailTable.tsx`:

```tsx
import type { DashboardTask } from "./dashboardMetrics";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function actualPeriod(task: DashboardTask) {
  if (!task.actualStartDate && !task.actualEndDate) return "未开始";
  return `${task.actualStartDate ?? "-"} 至 ${task.actualEndDate ?? "进行中"}`;
}

export function TaskDetailTable({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <section className="dashboard-panel" aria-labelledby="task-table-title">
      <div className="section-heading-row">
        <h2 id="task-table-title">任务明细</h2>
        <span>按里程碑分组扫描</span>
      </div>
      <div className="table-scroll">
        <table className="task-table dashboard-task-table">
          <thead>
            <tr>
              <th>编号</th>
              <th>项目内容</th>
              <th>任务名称</th>
              <th>计划周期</th>
              <th>实际周期</th>
              <th>完成比例</th>
              <th>状态</th>
              <th>责任人</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.milestoneCode}</td>
                <td>{task.projectContent}</td>
                <td className="cell-strong">{task.taskName}</td>
                <td>{task.plannedStartDate} 至 {task.plannedEndDate}</td>
                <td>{actualPeriod(task)}</td>
                <td>
                  <span className="progress-cell">
                    <span className="progress-track" aria-hidden="true">
                      <span style={{ width: `${Math.round(task.completionRatio * 100)}%` }} />
                    </span>
                    {percent(task.completionRatio)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${task.dashboardStatus} warning-${task.warningState}`}>
                    {task.riskLabel ?? task.statusLabel}
                  </span>
                </td>
                <td>{task.responsiblePerson}</td>
                <td>{task.remarks ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

Modify `DashboardPage.tsx`:

```tsx
import { RiskTaskStrip } from "./RiskTaskStrip";
import { TaskDetailTable } from "./TaskDetailTable";
```

Render below `ProjectSummaryDashboard`:

```tsx
<RiskTaskStrip tasks={model.riskTasks} />
<TaskDetailTable tasks={model.tasks} />
```

Append CSS:

```css
.section-heading-row {
  align-items: baseline;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  min-width: 0;
}

.section-heading-row h2 {
  font-size: 18px;
  margin: 0;
}

.section-heading-row span {
  color: #64748b;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.risk-strip,
.dashboard-panel {
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  box-sizing: border-box;
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 16px;
}

.risk-list {
  display: flex;
  gap: 10px;
  min-width: 0;
  overflow-x: auto;
  padding-bottom: 4px;
}

.risk-pill {
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  box-sizing: border-box;
  display: grid;
  flex: 0 0 220px;
  gap: 4px;
  min-width: 0;
  padding: 10px;
}

.risk-pill span,
.risk-pill em {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.risk-pill em {
  color: #8b3f35;
  font-style: normal;
  font-weight: 700;
}

.table-scroll {
  min-width: 0;
  overflow-x: auto;
}

.dashboard-task-table {
  min-width: 1060px;
}

.dashboard-task-table th,
.dashboard-task-table td {
  max-width: 220px;
  overflow-wrap: anywhere;
}

.cell-strong {
  font-weight: 700;
}

.progress-cell {
  align-items: center;
  display: grid;
  gap: 6px;
  min-width: 92px;
}

.progress-track {
  background: #edf2f7;
  border-radius: 999px;
  height: 8px;
  overflow: hidden;
}

.progress-track span {
  background: #2f80c0;
  display: block;
  height: 100%;
}

.status-badge {
  border-radius: 999px;
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  max-width: 140px;
  overflow: hidden;
  padding: 5px 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warning-overdue,
.status-start-delayed {
  background: #fff1ed;
  border-color: #db6b5f;
  color: #8b3f35;
}

.warning-due-today,
.warning-within-week {
  background: #fff7db;
  border-color: #e0b341;
  color: #735500;
}
```

- [x] **Step 4: Run test to verify GREEN**

Run:

```bash
cd web
npm test -- src/features/project/DashboardPage.test.tsx
```

Expected: PASS.

- [x] **Step 5: Check off OpenSpec tasks 2.1, 2.2, 2.3**

In `tasks.md`, check off task detail view tasks after the table renders.

- [x] **Step 6: Commit risk and table**

Run:

```bash
git add web/src/features/project/DashboardPage.tsx web/src/features/project/DashboardPage.test.tsx \
  web/src/features/project/RiskTaskStrip.tsx web/src/features/project/TaskDetailTable.tsx web/src/styles.css \
  "00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/project-dashboard-frontend/tasks.md"
git commit -m "feat: add dashboard risks and task table"
```

## Task 4: Timeline And Mobile Landscape Guidance

**Files:**
- Create: `web/src/features/project/ProjectTimeline.tsx`
- Create: `web/src/features/project/LandscapeGate.tsx`
- Modify: `web/src/features/project/DashboardPage.tsx`
- Modify: `web/src/features/project/DashboardPage.test.tsx`
- Modify: `web/src/styles.css`
- Modify: `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/project-dashboard-frontend/tasks.md`

- [x] **Step 1: Write failing tests for timeline and portrait guidance**

Append to `DashboardPage.test.tsx`:

```tsx
it("renders the project timeline", async () => {
  render(<DashboardPage today="2026-06-19" />);

  expect(await screen.findByText("计划时间轴")).toBeInTheDocument();
  expect(screen.getByText("硬件架构选型+关键器件确认")).toBeInTheDocument();
  expect(screen.getByText("当前日期")).toBeInTheDocument();
});

it("includes mobile landscape guidance", async () => {
  render(<DashboardPage today="2026-06-19" />);

  expect(await screen.findByText("建议横屏查看")).toBeInTheDocument();
});
```

- [x] **Step 2: Run test to verify RED**

Run:

```bash
cd web
npm test -- src/features/project/DashboardPage.test.tsx
```

Expected: FAIL because timeline and landscape gate are not implemented.

- [x] **Step 3: Implement timeline and landscape gate**

Create `web/src/features/project/ProjectTimeline.tsx`:

```tsx
import type { DashboardModel } from "./dashboardMetrics";

export function ProjectTimeline({ model }: { model: DashboardModel }) {
  return (
    <section className="dashboard-panel" aria-labelledby="timeline-title">
      <div className="section-heading-row">
        <h2 id="timeline-title">计划时间轴</h2>
        <span>{model.timelineRange.startDate} 至 {model.timelineRange.endDate}</span>
      </div>
      <div className="timeline-scroll">
        <div className="timeline-frame">
          <div className="timeline-today" style={{ left: "45%" }}>
            <span>当前日期</span>
          </div>
          {model.tasks.map((task) => (
            <div className="timeline-row" key={task.id}>
              <span className="timeline-label">{task.taskName}</span>
              <div className="timeline-track">
                <span
                  className={`timeline-bar status-${task.dashboardStatus} warning-${task.warningState}`}
                  style={{
                    left: `${task.timeline.leftPercent}%`,
                    width: `${Math.max(task.timeline.widthPercent, 2)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Create `web/src/features/project/LandscapeGate.tsx`:

```tsx
import type { ReactNode } from "react";

export function LandscapeGate({ children }: { children: ReactNode }) {
  return (
    <>
      <aside className="landscape-gate" aria-label="移动端横屏提示">
        <strong>建议横屏查看</strong>
        <span>项目任务表和计划时间轴信息较多，请旋转手机以查看完整仪表盘。</span>
      </aside>
      <div className="landscape-content">{children}</div>
    </>
  );
}
```

Modify `DashboardPage.tsx`:

```tsx
import { LandscapeGate } from "./LandscapeGate";
import { ProjectTimeline } from "./ProjectTimeline";
```

Wrap main dashboard:

```tsx
return (
  <LandscapeGate>
    <section className="dashboard-page">
      <ProjectSummaryDashboard model={model} />
      <RiskTaskStrip tasks={model.riskTasks} />
      <TaskDetailTable tasks={model.tasks} />
      <ProjectTimeline model={model} />
    </section>
  </LandscapeGate>
);
```

Append CSS:

```css
.timeline-scroll {
  min-width: 0;
  overflow-x: auto;
}

.timeline-frame {
  box-sizing: border-box;
  min-width: 980px;
  padding: 22px 0 4px;
  position: relative;
}

.timeline-row {
  align-items: center;
  display: grid;
  gap: 12px;
  grid-template-columns: 240px 1fr;
  min-height: 34px;
}

.timeline-label {
  font-size: 13px;
  font-weight: 700;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-track {
  background: #edf2f7;
  border-radius: 999px;
  height: 12px;
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.timeline-bar {
  border-radius: 999px;
  display: block;
  height: 100%;
  position: absolute;
  top: 0;
}

.timeline-bar.status-finished {
  background: #3c9a67;
}

.timeline-bar.status-in-progress {
  background: #2f80c0;
}

.timeline-bar.status-start-delayed,
.timeline-bar.warning-overdue {
  background: #db6b5f;
}

.timeline-bar.status-not-started {
  background: #9aa8b8;
}

.timeline-today {
  bottom: 0;
  border-left: 2px solid #17202a;
  position: absolute;
  top: 0;
  z-index: 2;
}

.timeline-today span {
  background: #17202a;
  border-radius: 4px;
  color: #ffffff;
  display: inline-block;
  font-size: 11px;
  line-height: 1;
  max-width: 72px;
  overflow: hidden;
  padding: 4px 5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.landscape-gate {
  display: none;
}

@media (max-width: 760px) and (orientation: portrait) {
  .landscape-gate {
    align-items: center;
    box-sizing: border-box;
    display: grid;
    gap: 12px;
    min-height: calc(100vh - 64px);
    padding: 24px;
    text-align: center;
  }

  .landscape-gate strong {
    font-size: clamp(22px, 8vw, 34px);
    overflow-wrap: anywhere;
  }

  .landscape-gate span {
    color: #536173;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .landscape-content {
    display: none;
  }
}

@media (max-width: 960px) and (orientation: landscape) {
  .app-shell {
    padding: 18px;
  }

  .metric-grid {
    grid-template-columns: repeat(3, minmax(120px, 1fr));
  }
}
```

- [x] **Step 4: Run test to verify GREEN**

Run:

```bash
cd web
npm test -- src/features/project/DashboardPage.test.tsx
```

Expected: PASS.

- [x] **Step 5: Check off OpenSpec tasks 3.1, 3.2, 3.3, 4.1, 4.2**

In `tasks.md`, check off timeline and responsive implementation tasks after tests pass.

- [x] **Step 6: Commit timeline and mobile behavior**

Run:

```bash
git add web/src/features/project/DashboardPage.tsx web/src/features/project/DashboardPage.test.tsx \
  web/src/features/project/ProjectTimeline.tsx web/src/features/project/LandscapeGate.tsx web/src/styles.css \
  "00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/project-dashboard-frontend/tasks.md"
git commit -m "feat: add project timeline and landscape guidance"
```

## Task 5: Version Records And Visual Verification

**Files:**
- Modify: `00_AI协作工作区/03_版本迭代/VERSION.md`
- Modify: `00_AI协作工作区/03_版本迭代/CHANGELOG.md`
- Modify: `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/project-dashboard-frontend/tasks.md`

- [x] **Step 1: Run full automated verification**

Run:

```bash
cd web
npm test
npm run build
```

Expected: all tests pass and build succeeds.

- [x] **Step 2: Run local browser visual checks**

Start the dev server:

```bash
cd web
npm run dev -- --host 127.0.0.1
```

Use browser checks for:

- Desktop viewport around `1440x900`: dashboard visible, KPI cards do not overflow, table/timeline readable.
- Mobile landscape viewport around `844x390`: dashboard visible, KPI wraps to 3 columns, table/timeline can scroll horizontally.
- Mobile portrait viewport around `390x844`: landscape guidance visible and dashboard content hidden.

If any text overflows or overlaps, adjust CSS before continuing.

- [x] **Step 3: Update version records**

In `VERSION.md`, add or update:

```md
- `project-dashboard-frontend`: `v1.0`
```

In `CHANGELOG.md`, add:

```md
## project-dashboard-frontend v1.0 - 2026-06-19

- 新增 CPID710R8 项目总览仪表盘。
- 新增 KPI 指标、风险任务横条、高密度任务明细表和轻量计划时间轴。
- 新增 `dashboardStatus` 派生状态，支持延迟启动任务识别，同时保留 `elapsedDays` 兼容字段。
- 新增手机竖屏横屏引导，桌面和手机横屏展示完整看板。
- 视觉约束：指标卡、标签、任务表、时间轴和横屏提示需避免文字溢出和不可读重叠。
- 验证：`npm test` 通过。
- 验证：`npm run build` 通过。
- 可交给 Claude Code 审查：是。
```

- [x] **Step 4: Check off OpenSpec task 4.3**

In `tasks.md`, change:

```md
- [x] 4.3 Verify the dashboard on desktop and mobile landscape viewport sizes.
```

to:

```md
- [x] 4.3 Verify the dashboard on desktop and mobile landscape viewport sizes.
```

- [x] **Step 5: Commit verification records**

Run:

```bash
git add "00_AI协作工作区/03_版本迭代/VERSION.md" \
  "00_AI协作工作区/03_版本迭代/CHANGELOG.md" \
  "00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/project-dashboard-frontend/tasks.md"
git commit -m "chore: record project dashboard version"
```

## Final Build Gate

- [x] Run:

```bash
cd web
npm test
npm run build
```

- [x] Confirm every checkbox in `openspec/changes/project-dashboard-frontend/tasks.md` is checked.
- [x] If review mode is `standard` or `thorough`, run the requested code review step before build guard.
- [x] Run Comet build guard:

```bash
cd 00_AI协作工作区/05_Comet工作区/codex-openspec
COMET_ENV=/Users/mac/.codex/skills/comet/scripts/comet-env.sh
. "$COMET_ENV"
"$COMET_BASH" "$COMET_GUARD" project-dashboard-frontend build --apply
```
