---
change: fix-dashboard-status-and-admin-list
design-doc: docs/superpowers/specs/2026-06-21-fix-dashboard-status-and-admin-list-design.md
base-ref: 8950435a5390f151cf24b3f723e0507454b05d5e
archived-with: 2026-06-21-fix-dashboard-status-and-admin-list
---

# fix-dashboard-status-and-admin-list Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 dashboard 生命周期统计、延迟启动风险颜色、后台任务列表高度对齐三个回归。

**Architecture:** 保持现有 React + TypeScript + CSS 架构，仅在展示层和指标派生逻辑内做最小修改。生命周期状态由实际日期决定，延迟启动独立作为风险维度；后台布局通过 CSS grid/flex 合作实现左侧面板对齐和列表内部滚动。

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, CSS。

archived-with: 2026-06-21-fix-dashboard-status-and-admin-list
---

## File Structure

- Modify: `web/src/features/project/dashboardMetrics.test.ts`
  - 添加生命周期计数闭合和延迟启动状态归类回归测试。
- Modify: `web/src/features/project/dashboardMetrics.ts`
  - 删除 `start-delayed` 生命周期状态，把延迟启动保留为独立风险/KPI。
- Modify: `web/src/features/project/RiskTaskStrip.tsx`
  - 为延迟启动风险输出独立 warning class。
- Modify: `web/src/features/project/TaskDetailTable.tsx`
  - 状态 badge 同步使用独立 warning class，避免延迟启动颜色依赖生命周期状态。
- Modify: `web/src/styles.test.ts`
  - 更新后台列表高度和延迟启动 warning 样式断言。
- Modify: `web/src/styles.css`
  - 移除旧 admin panel viewport max-height，添加 `warning-start-delayed` 样式。
- Modify: `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/fix-dashboard-status-and-admin-list/tasks.md`
  - 完成任务后勾选。

不修改 CloudBase、部署配置、seed 数据、仓库远端或用户资料目录。

## Task 1: Dashboard Lifecycle Semantics

**Files:**
- Modify: `web/src/features/project/dashboardMetrics.test.ts`
- Modify: `web/src/features/project/dashboardMetrics.ts`

- [x] **Step 1: Write the failing lifecycle partition test**

In `web/src/features/project/dashboardMetrics.test.ts`, update the existing `derives task status counts including delayed starts` expectation so the delayed-start task is still `in-progress`, then add an explicit partition assertion:

```ts
expect(model.metrics.finishedTasks).toBe(1);
expect(model.metrics.inProgressTasks).toBe(2);
expect(model.metrics.startDelayedTasks).toBe(1);
expect(model.metrics.notStartedTasks).toBe(2);
expect(
  model.metrics.finishedTasks + model.metrics.inProgressTasks + model.metrics.notStartedTasks,
).toBe(model.metrics.totalDetailTasks);
expect(model.tasks.find((item) => item.id === "late-start")?.dashboardStatus).toBe(
  "in-progress",
);
```

Also add a partition assertion to `counts completed tasks with late actual starts in delayed-start metrics`:

```ts
expect(
  model.metrics.finishedTasks + model.metrics.inProgressTasks + model.metrics.notStartedTasks,
).toBe(model.metrics.totalDetailTasks);
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test --workspace web -- dashboardMetrics.test.ts
```

Expected before implementation: FAIL because `late-start` currently has `dashboardStatus` of `start-delayed` and `inProgressTasks` is `1`.

- [x] **Step 3: Implement lifecycle-only status**

In `web/src/features/project/dashboardMetrics.ts`, change the type and helpers so delayed start is not a dashboard status:

```ts
export type DashboardTaskStatus = "finished" | "in-progress" | "not-started";
```

Update `getDashboardStatus`:

```ts
export function getDashboardStatus(task: ProjectTask, today: string): DashboardTaskStatus {
  void today;
  if (task.actualEndDate) return "finished";
  if (task.actualStartDate) return "in-progress";
  return "not-started";
}
```

Update `getStatusLabel` by removing the `"start-delayed"` entry:

```ts
function getStatusLabel(status: DashboardTaskStatus): string {
  const labels: Record<DashboardTaskStatus, string> = {
    finished: "已完成",
    "in-progress": "进行中",
    "not-started": "未开始",
  };
  return labels[status];
}
```

Update `getRiskLabel`:

```ts
function getRiskLabel(task: ProjectTask): string | undefined {
  if (task.warningState === "overdue") return `延期${task.overdueDays ?? 0}天`;
  if (task.warningState === "due-today") return "今日到期";
  if (task.warningState === "within-week") return "7日内到期";
  if (hasDelayedActualStart(task)) return "延迟启动";
  return undefined;
}
```

Update `isRiskTask`:

```ts
function isRiskTask(task: ProjectTask): boolean {
  return (
    task.warningState === "overdue" ||
    task.warningState === "due-today" ||
    task.warningState === "within-week" ||
    hasDelayedActualStart(task)
  );
}
```

Update call sites inside `buildDashboardModel`:

```ts
riskLabel: getRiskLabel(task),
```

and:

```ts
riskTasks: dashboardTasks.filter(isRiskTask),
```

- [x] **Step 4: Run focused test and verify GREEN**

Run:

```bash
npm test --workspace web -- dashboardMetrics.test.ts
```

Expected: PASS.

## Task 2: Delayed-Start Warning Presentation

**Files:**
- Modify: `web/src/features/project/RiskTaskStrip.tsx`
- Modify: `web/src/features/project/TaskDetailTable.tsx`
- Modify: `web/src/styles.test.ts`
- Modify: `web/src/styles.css`

- [x] **Step 1: Write failing style regression tests**

In `web/src/styles.test.ts`, add:

```ts
it("uses a dedicated visible warning style for delayed-start risks", () => {
  expect(styles).toMatch(/\.warning-start-delayed\s*\{[^}]*background:\s*#fff1ed[^}]*border-color:\s*#db6b5f[^}]*color:\s*#8b3f35[^}]*\}/s);
});
```

Also update any assertion that still expects `.status-start-delayed` to drive warning color so it no longer relies on that status class.

- [x] **Step 2: Run style test and verify RED**

Run:

```bash
npm test --workspace web -- styles.test.ts
```

Expected before implementation: FAIL because `.warning-start-delayed` does not exist.

- [x] **Step 3: Implement warning class helper in risk strip**

In `web/src/features/project/RiskTaskStrip.tsx`, add:

```tsx
function warningClass(task: DashboardTask): string {
  return task.riskLabel === "延迟启动" ? "warning-start-delayed" : `warning-${task.warningState}`;
}
```

Use it in the article class:

```tsx
className={`risk-pill status-${task.dashboardStatus} ${warningClass(task)}`}
```

- [x] **Step 4: Implement warning class helper in task detail table**

In `web/src/features/project/TaskDetailTable.tsx`, add:

```tsx
function warningClass(task: DashboardTask): string {
  return task.riskLabel === "延迟启动" ? "warning-start-delayed" : `warning-${task.warningState}`;
}
```

Use it in the status badge:

```tsx
<span className={`status-badge status-${task.dashboardStatus} ${warningClass(task)}`}>
```

- [x] **Step 5: Add dedicated CSS style**

In `web/src/styles.css`, change the warning block from:

```css
.warning-overdue,
.status-start-delayed {
  background: #fff1ed;
  border-color: #db6b5f;
  color: #8b3f35;
}
```

to:

```css
.warning-overdue,
.warning-start-delayed {
  background: #fff1ed;
  border-color: #db6b5f;
  color: #8b3f35;
}
```

- [x] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
npm test --workspace web -- styles.test.ts
npm test --workspace web -- DashboardPage.test.tsx TaskDetailTable.test.tsx
```

Expected: PASS.

## Task 3: Admin Task List Height Alignment

**Files:**
- Modify: `web/src/styles.test.ts`
- Modify: `web/src/styles.css`
- Optionally inspect only: `web/src/features/project/AdminPage.tsx`

- [x] **Step 1: Write failing CSS regression test**

In `web/src/styles.test.ts`, update `keeps the admin task list bounded with internal scrolling` so it asserts the old viewport cap is gone:

```ts
it("lets the admin task panel stretch to the right column while the list scrolls internally", () => {
  expect(styles).not.toMatch(/\.admin-layout\s*>\s*\.admin-panel\s*\{[^}]*max-height:\s*calc\(100vh\s*-\s*220px\)/s);
  expect(styles).toMatch(/\.admin-layout\s*>\s*\.admin-panel\s*\{[^}]*height:\s*100%[^}]*min-height:\s*0[^}]*\}/s);
  expect(styles).toMatch(/\.admin-task-list\s*\{[^}]*flex:\s*1[^}]*min-height:\s*0[^}]*overflow:\s*auto[^}]*\}/s);
});
```

- [x] **Step 2: Run style test and verify RED**

Run:

```bash
npm test --workspace web -- styles.test.ts
```

Expected before implementation: FAIL because the old `max-height: calc(100vh - 220px)` still exists.

- [x] **Step 3: Remove the left panel viewport cap**

In `web/src/styles.css`, update:

```css
.admin-layout > .admin-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
```

Keep `.admin-task-list` with:

```css
.admin-task-list {
  align-content: start;
  display: grid;
  gap: 8px;
  flex: 1;
  list-style: none;
  margin: 12px 0 0;
  min-height: 0;
  overflow: auto;
  padding: 0;
}
```

- [x] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
npm test --workspace web -- styles.test.ts
npm test --workspace web -- AdminPage.test.tsx
```

Expected: PASS.

## Task 4: Full Verification and Review Handoff

**Files:**
- Modify: `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/fix-dashboard-status-and-admin-list/tasks.md`

- [x] **Step 1: Run full test suite**

Run:

```bash
npm test --workspace web
```

Expected: PASS.

- [x] **Step 2: Run production build**

Run:

```bash
npm run build --workspace web
```

Expected: PASS.

- [x] **Step 3: Validate OpenSpec change and specs**

Run from `00_AI协作工作区/05_Comet工作区/codex-openspec`:

```bash
openspec validate fix-dashboard-status-and-admin-list --strict
openspec validate --specs --strict
```

Expected: both PASS.

- [x] **Step 4: Mark OpenSpec task checklist complete**

Update `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/fix-dashboard-status-and-admin-list/tasks.md` so all implementation and verification checkboxes are checked.

- [x] **Step 5: Prepare Claude Code review instruction**

Provide the user with this review instruction before archive or push:

```text
请按只读 Reviewer 方式审查 change：fix-dashboard-status-and-admin-list。

背景：
- 本次只修复 3 个展示/统计回归，不应修改 CloudBase、部署配置、seed 数据、远端仓库或用户资料目录。
- 技术设计文档：00_AI协作工作区/05_Comet工作区/codex-openspec/docs/superpowers/specs/2026-06-21-fix-dashboard-status-and-admin-list-design.md
- OpenSpec change：00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/fix-dashboard-status-and-admin-list/

重点审查：
1. dashboardMetrics.ts 中生命周期状态是否只包含 finished / in-progress / not-started，且不再用 start-delayed 挤占生命周期状态。
2. finishedTasks + inProgressTasks + notStartedTasks 是否能与 totalDetailTasks 闭合；延迟启动是否仍作为独立 startDelayedTasks KPI。
3. 延迟启动风险卡片和任务状态 badge 是否使用独立 warning-start-delayed 样式，避免 warning-none 导致白色风险卡。
4. 后台维护左侧任务列表是否移除了旧 max-height: calc(100vh - 220px)，并保持 .admin-task-list 内部滚动。
5. 是否没有改动 CloudBase 持久化、部署配置、seed 数据、远端仓库、用户资料目录或其他无关功能。

请运行或核对：
- npm test --workspace web
- npm run build --workspace web
- cd 00_AI协作工作区/05_Comet工作区/codex-openspec && openspec validate fix-dashboard-status-and-admin-list --strict && openspec validate --specs --strict

请把审查报告写入：
00_AI协作工作区/04_双AI审查/Claude审查-fix-dashboard-status-and-admin-list-v1.0.md

结论请明确写：通过 / 有条件通过 / 不通过，并列出阻塞项和建议项。
```

- [x] **Step 6: Stop for Claude Code review**

Do not archive or push until the user confirms Claude Code review passed.
