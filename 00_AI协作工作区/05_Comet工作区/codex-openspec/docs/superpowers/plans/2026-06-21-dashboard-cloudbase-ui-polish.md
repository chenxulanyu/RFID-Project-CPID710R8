---
change: dashboard-cloudbase-ui-polish
design-doc: docs/superpowers/specs/2026-06-21-dashboard-cloudbase-ui-polish-design.md
base-ref: bc20c2e6bfdfedc8913d0fdff0f221de19839e31
---

# Dashboard CloudBase UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the dashboard CloudBase fallback regression and polish KPI, timeline, and admin layout behavior.

**Architecture:** Keep the fix at existing boundaries: public data validity in `projectService.ts`, dashboard rendering in feature components, and layout behavior in `styles.css`. Avoid CloudBase configuration or deployment changes.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, CSS.

---

### Task 1: Public CloudBase Task Read Validity

**Files:**
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/services/projectService.test.ts`
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/services/projectService.ts`

- [ ] **Step 1: Write the failing test**

Add this test to `describe("project service", ...)` in `projectService.test.ts`:

```ts
  it("keeps CloudBase tasks valid when optional owner fields are blank", async () => {
    const repository = LocalProjectRepository.fromSnapshot({
      project: {
        id: "cpid710r8",
        name: "CPID710R8 CloudBase",
        plannedStartDate: "2026-03-30",
        plannedEndDate: "2026-11-05",
        calendarMode: "calendar-days",
      },
      tasks: [
        {
          id: "custom-cloud-task",
          milestoneCode: "M21",
          projectContent: "新增验证任务",
          taskName: "CloudBase 空负责人任务",
          plannedStartDate: "2026-10-20",
          plannedEndDate: "2026-11-05",
          resourceOwner: "",
          responsiblePerson: "",
        },
      ],
    });

    const data = await getProjectProgress("2026-10-21", repository);

    expect(data.tasks).toHaveLength(1);
    expect(data.tasks[0]).toMatchObject({
      id: "custom-cloud-task",
      resourceOwner: "",
      responsiblePerson: "",
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test --workspace web -- web/src/services/projectService.test.ts
```

Expected: FAIL because current `hasRequiredTaskFields` treats blank `resourceOwner` / `responsiblePerson` as invalid and falls back to seeded tasks.

- [ ] **Step 3: Write minimal implementation**

In `projectService.ts`, update `hasRequiredTaskFields` so it no longer requires `resourceOwner` and `responsiblePerson`:

```ts
function hasRequiredTaskFields(task: ProjectTaskInput): boolean {
  return Boolean(
    task.id &&
      task.milestoneCode &&
      task.projectContent &&
      task.taskName &&
      task.plannedStartDate &&
      task.plannedEndDate,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test --workspace web -- web/src/services/projectService.test.ts
```

Expected: PASS.

### Task 2: Dashboard KPI Order and Content-Aware Layout

**Files:**
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/DashboardPage.test.tsx`
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/ProjectSummaryDashboard.tsx`
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/styles.css`

- [ ] **Step 1: Write the failing KPI order test**

In `DashboardPage.test.tsx`, extend `renders project summary KPI cards`:

```ts
    const metricLabels = screen
      .getByLabelText("项目关键指标")
      .querySelectorAll(".metric-card span");
    expect([...metricLabels].map((node) => node.textContent)).toEqual([
      "总体进度",
      "任务总数",
      "延期/临期",
      "延迟启动",
      "已完成",
      "进行中",
      "未启动",
    ]);
```

- [ ] **Step 2: Add CSS regression test**

Create or extend an existing CSS text test. If no CSS test exists, add `web/src/styles.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import styles from "./styles.css?raw";

describe("styles", () => {
  it("uses content-aware metric card columns on desktop", () => {
    expect(styles).toMatch(/\.metric-grid\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(min-content,\s*max-content\)\)/s);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm test --workspace web -- web/src/features/project/DashboardPage.test.tsx web/src/styles.test.ts
```

Expected: FAIL because KPI order and CSS are still old.

- [ ] **Step 4: Reorder KPI cards**

In `ProjectSummaryDashboard.tsx`, move the warning and danger cards immediately after task total:

```tsx
        <article className="metric-card metric-card-warning">
          <span>延期/临期</span>
          <strong>{riskTotal}</strong>
        </article>
        <article className="metric-card metric-card-danger">
          <span>延迟启动</span>
          <strong>{metrics.startDelayedTasks}</strong>
        </article>
```

Then render completed, in-progress, and not-started cards after them.

- [ ] **Step 5: Update metric CSS**

In `styles.css`, update desktop `.metric-grid`:

```css
.metric-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(7, minmax(min-content, max-content));
  justify-content: start;
  min-width: 0;
}
```

Update `.metric-card`:

```css
.metric-card {
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  box-sizing: border-box;
  min-height: 88px;
  min-width: 126px;
  padding: 14px;
  width: max-content;
}
```

Keep existing responsive media queries, but adjust them if they override desktop behavior too aggressively.

- [ ] **Step 6: Run tests**

Run:

```bash
npm test --workspace web -- web/src/features/project/DashboardPage.test.tsx web/src/styles.test.ts
```

Expected: PASS.

### Task 3: Timeline Legend and No Bar Percent Text

**Files:**
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/ProjectTimeline.test.tsx`
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/ProjectTimeline.tsx`
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/styles.css`

- [ ] **Step 1: Update failing timeline tests**

In `ProjectTimeline.test.tsx`, replace percentage expectations with:

```ts
  it("shows a legend for planned and actual spans", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({
          id: "timeline",
          taskName: "时间轴任务",
          actualStartDate: "2026-06-01",
          actualEndDate: "2026-06-08",
        }),
      ],
    });

    const { getByText } = render(<ProjectTimeline model={model} />);

    expect(getByText("计划周期")).toBeInTheDocument();
    expect(getByText("实际周期")).toBeInTheDocument();
  });

  it("does not render completion percentage text inside timeline bars", () => {
    const model = buildDashboardModel({
      project,
      today: "2026-06-19",
      tasks: [
        task({ id: "progress", taskName: "进度任务", actualStartDate: "2026-06-01", completionRatio: 0.95 }),
      ],
    });

    const { container } = render(<ProjectTimeline model={model} />);

    expect(container.querySelector(".timeline-bar-plan")).not.toHaveTextContent("95%");
    expect(container.querySelector(".timeline-percent")).toBeNull();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test --workspace web -- web/src/features/project/ProjectTimeline.test.tsx
```

Expected: FAIL because legend is absent and `.timeline-percent` exists.

- [ ] **Step 3: Implement timeline legend and remove percent span**

In `ProjectTimeline.tsx`, add a legend near the heading:

```tsx
      <div className="timeline-legend" aria-label="时间轴图示">
        <span><i className="timeline-legend-plan" />计划周期</span>
        <span><i className="timeline-legend-actual" />实际周期</span>
      </div>
```

Remove:

```tsx
<span className="timeline-percent">{task.timeline.percent}%</span>
```

- [ ] **Step 4: Update CSS**

Remove `.timeline-percent` rules and add:

```css
.timeline-legend {
  align-items: center;
  color: #64748b;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  font-weight: 700;
}

.timeline-legend span {
  align-items: center;
  display: inline-flex;
  gap: 6px;
}

.timeline-legend i {
  border-radius: 999px;
  display: inline-block;
  height: 8px;
  width: 24px;
}

.timeline-legend-plan {
  background: #3b82f6;
}

.timeline-legend-actual {
  background: #ef4444;
}
```

- [ ] **Step 5: Run test**

Run:

```bash
npm test --workspace web -- web/src/features/project/ProjectTimeline.test.tsx
```

Expected: PASS.

### Task 4: Admin Project Section Natural Height

**Files:**
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/styles.test.ts`
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/styles.css`

- [ ] **Step 1: Add failing CSS regression test**

Add to `web/src/styles.test.ts`:

```ts
  it("keeps admin right-side sections at natural height", () => {
    expect(styles).toMatch(/\.admin-panels\s*\{[^}]*align-content:\s*start[^}]*align-items:\s*start[^}]*\}/s);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test --workspace web -- web/src/styles.test.ts
```

Expected: FAIL because `.admin-panels` currently does not declare natural-height alignment.

- [ ] **Step 3: Implement CSS fix**

In `.admin-panels`, add:

```css
  align-content: start;
  align-items: start;
```

Do not remove `.admin-layout > .admin-panel` flex/stretch behavior.

- [ ] **Step 4: Run test**

Run:

```bash
npm test --workspace web -- web/src/styles.test.ts
```

Expected: PASS.

### Task 5: Full Verification and Review Prompt

**Files:**
- Modify: `/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/dashboard-cloudbase-ui-polish/tasks.md`

- [ ] **Step 1: Run full tests**

Run:

```bash
npm test --workspace web
```

Expected: all tests pass.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build --workspace web
```

Expected: build passes.

- [ ] **Step 3: Prepare Claude Code review instruction**

Generate a Chinese review prompt covering:

- Change name: `dashboard-cloudbase-ui-polish`
- Base ref: `bc20c2e6bfdfedc8913d0fdff0f221de19839e31`
- Files changed by this implementation
- Required focus: CloudBase fallback root cause, optional owner/person consistency, KPI layout/order, timeline legend/no percentage, admin panel height, no deployment config changes
- Commands run and results

- [ ] **Step 4: Stop for Claude Code review**

Do not push or archive until the user reports Claude Code review passed.
