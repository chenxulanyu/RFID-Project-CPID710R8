---
change: dashboard-status-responsive-polish
design-doc: docs/superpowers/specs/2026-06-21-dashboard-status-responsive-polish-design.md
base-ref: a25a3074632d29b51543f7055f8e8e09d1e7bc0e
archived-with: 2026-06-21-dashboard-status-responsive-polish
---

# Dashboard Status Responsive Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adjust dashboard status metrics and responsive/admin layout behavior without touching CloudBase, deployment, or project data files.

**Architecture:** Keep changes inside the existing frontend seams: status logic in `dashboardMetrics.ts`, layout contracts in `styles.css`, and regression coverage in existing Vitest files. Use CSS-only layout adjustments where possible and preserve existing React component markup.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, CSS.

archived-with: 2026-06-21-dashboard-status-responsive-polish
---

### Task 1: Update Dashboard Status Tests

**Files:**
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/dashboardMetrics.test.ts`

- [x] **Step 1: Replace the legacy delayed-start test expectations**

Update the first test so `late-start` has a real late actual start date and add a missing-start task that should be not-started:

```ts
task({
  id: "late-start",
  milestoneCode: "M3",
  taskName: "延迟启动",
  plannedStartDate: "2026-06-10",
  plannedEndDate: "2026-06-25",
  actualStartDate: "2026-06-12",
  completionRatio: 0.1,
  warningState: "future",
  elapsedDays: 8,
}),
task({
  id: "missing-actual-start",
  milestoneCode: "M4",
  taskName: "未填实际开始",
  plannedStartDate: "2026-06-01",
  plannedEndDate: "2026-06-05",
  warningState: "future",
}),
task({
  id: "future",
  milestoneCode: "M5",
  taskName: "未来未开始",
  plannedStartDate: "2026-07-01",
  plannedEndDate: "2026-07-05",
  warningState: "future",
}),
```

Expected assertions:

```ts
expect(model.metrics.totalTasks).toBe(5);
expect(model.metrics.finishedTasks).toBe(1);
expect(model.metrics.inProgressTasks).toBe(1);
expect(model.metrics.startDelayedTasks).toBe(1);
expect(model.metrics.notStartedTasks).toBe(2);
expect(model.tasks.find((item) => item.id === "late-start")?.dashboardStatus).toBe("start-delayed");
expect(model.tasks.find((item) => item.id === "missing-actual-start")?.dashboardStatus).toBe("not-started");
```

- [x] **Step 2: Add a boundary test for on-time or early actual starts**

Add this test inside `describe("dashboardMetrics", ...)`:

```ts
it("does not count tasks with on-time or early actual starts as delayed starts", () => {
  const model = buildDashboardModel({
    project,
    today: "2026-06-19",
    tasks: [
      task({
        id: "early",
        taskName: "提前启动",
        plannedStartDate: "2026-06-10",
        plannedEndDate: "2026-06-20",
        actualStartDate: "2026-06-08",
        elapsedDays: 12,
        completionRatio: 0.4,
      }),
      task({
        id: "on-time",
        taskName: "按时启动",
        plannedStartDate: "2026-06-10",
        plannedEndDate: "2026-06-20",
        actualStartDate: "2026-06-10",
        elapsedDays: 10,
        completionRatio: 0.5,
      }),
    ],
  });

  expect(model.metrics.startDelayedTasks).toBe(0);
  expect(model.metrics.notStartedTasks).toBe(0);
  expect(model.tasks.map((item) => item.dashboardStatus)).toEqual(["in-progress", "in-progress"]);
});
```

- [x] **Step 3: Run the targeted test and confirm RED**

Run:

```bash
npm test --workspace web -- dashboardMetrics.test.ts
```

Expected: FAIL because the current implementation still treats missing actual starts before today as `start-delayed`, and actual late starts as `in-progress`.

### Task 2: Implement Dashboard Status Semantics

**Files:**
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/dashboardMetrics.ts`
- Test: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/dashboardMetrics.test.ts`

- [x] **Step 1: Update status derivation minimally**

Change `getDashboardStatus` so actual late start is classified before regular in-progress, and missing actual start falls through to not-started:

```ts
export function getDashboardStatus(task: ProjectTask, today: string): DashboardTaskStatus {
  void today;
  if (task.actualEndDate) return "finished";
  if (task.actualStartDate && compareDate(task.actualStartDate, task.plannedStartDate) > 0) return "start-delayed";
  if (task.actualStartDate) return "in-progress";
  if (task.elapsedDays === "finished") return "finished";
  return "not-started";
}
```

- [x] **Step 2: Run targeted metrics tests and confirm GREEN**

Run:

```bash
npm test --workspace web -- dashboardMetrics.test.ts
```

Expected: PASS.

### Task 3: Update Layout CSS Tests

**Files:**
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/styles.test.ts`

- [x] **Step 1: Replace KPI grid test**

Replace the current `uses content-aware metric card columns on desktop` test with:

```ts
it("uses seven width-filling metric card columns on desktop", () => {
  expect(styles).toMatch(/\.metric-grid\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(128px,\s*1fr\)\)/s);
  expect(styles).toMatch(/\.metric-grid\s*\{[^}]*width:\s*100%/s);
});
```

- [x] **Step 2: Add mobile KPI row regression**

Add:

```ts
it("keeps the metric grid as one row on mobile layout", () => {
  expect(styles).not.toMatch(/@media\s*\(max-width:\s*760px\)[\s\S]*?\.metric-grid\s*\{[^}]*repeat\(2,/);
  expect(styles).toMatch(/@media\s*\(max-width:\s*760px\)[\s\S]*?\.metric-grid\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(112px,\s*1fr\)\)/);
});
```

- [x] **Step 3: Add admin list bounded-height regression**

Add:

```ts
it("keeps the admin task list bounded with internal scrolling", () => {
  expect(styles).toMatch(/\.admin-layout\s*>\s*\.admin-panel\s*\{[^}]*max-height:\s*calc\(100vh\s*-\s*220px\)/s);
  expect(styles).toMatch(/\.admin-task-list\s*\{[^}]*overflow:\s*auto[^}]*\}/s);
});
```

- [x] **Step 4: Run CSS tests and confirm RED**

Run:

```bash
npm test --workspace web -- styles.test.ts
```

Expected: FAIL because current CSS still uses max-content KPI columns and mobile two-column layout.

### Task 4: Implement Responsive KPI And Admin List CSS

**Files:**
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/styles.css`
- Test: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/styles.test.ts`

- [x] **Step 1: Update desktop KPI grid and cards**

Change `.metric-grid` and `.metric-card` to fill the row:

```css
.metric-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(7, minmax(128px, 1fr));
  justify-content: stretch;
  min-width: 0;
  overflow-x: auto;
  width: 100%;
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
```

- [x] **Step 2: Add bounded admin panel height**

Inside `.admin-layout > .admin-panel`, add:

```css
max-height: calc(100vh - 220px);
```

Keep `.admin-task-list` as the internal scroll owner with `flex: 1`, `min-height: 0`, and `overflow: auto`.

- [x] **Step 3: Update responsive KPI rules**

Replace the `@media (max-width: 1100px)` `.metric-grid` rule with:

```css
@media (max-width: 1100px) {
  .metric-grid {
    grid-template-columns: repeat(7, minmax(118px, 1fr));
  }
}
```

Replace the `@media (max-width: 760px)` `.metric-grid` rule with:

```css
.metric-grid {
  grid-template-columns: repeat(7, minmax(112px, 1fr));
}
```

Within the same mobile media query, change `.admin-task-list` so it keeps internal scrolling:

```css
.admin-task-list {
  align-content: start;
  flex: 1;
  max-height: none;
}
```

- [x] **Step 4: Run CSS tests and confirm GREEN**

Run:

```bash
npm test --workspace web -- styles.test.ts
```

Expected: PASS.

### Task 5: Full Verification And OpenSpec Task Updates

**Files:**
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/dashboard-status-responsive-polish/tasks.md`

- [x] **Step 1: Run full frontend tests**

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

Expected: PASS. A Vite chunk-size warning is acceptable if the build exits successfully.

- [x] **Step 3: Run OpenSpec validation**

Run:

```bash
openspec validate --specs --strict
```

from:

```bash
/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/00_AI协作工作区/05_Comet工作区/codex-openspec
```

Expected: PASS.

- [x] **Step 4: Mark OpenSpec tasks complete**

Update every checkbox in:

```text
/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/dashboard-status-responsive-polish/tasks.md
```

from `[ ]` to `[x]` only after the matching implementation and verification have passed.

- [x] **Step 5: Prepare Claude Code review instruction**

Prepare a Chinese review prompt that tells Claude Code to review:

- status semantics in `dashboardMetrics.ts`;
- tests in `dashboardMetrics.test.ts`;
- KPI/admin CSS in `styles.css`;
- CSS regressions in `styles.test.ts`;
- OpenSpec artifacts for `dashboard-status-responsive-polish`;
- and to verify no CloudBase/deployment/project-data files were changed.
