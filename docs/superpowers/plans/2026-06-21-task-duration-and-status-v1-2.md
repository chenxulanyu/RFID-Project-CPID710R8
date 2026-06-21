---
archived-with: 2026-06-21-task-duration-and-status-v1-2
status: final
---
# 任务工期列与多标签状态 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 任务明细表新增计划工期/实际工期两列，状态列改为多标签组合，按启动偏差与结束偏差分档着色。

**Architecture:** 数据派生层 `dashboardMetrics.ts` 将 `riskLabel: string` 重构为 `riskLabels: string[]`，按未开始/进行中/已完成三阶段组装有序标签数组；表格与风险条组件同步渲染多标签；样式新增四档配色（绿/黄/红橙/中性），延迟启动配色由红橙改为黄。

**Tech Stack:** React + TypeScript + Vite + Vitest；样式为原生 CSS（`styles.css`）。

---

change: task-duration-and-status-v1-2
design-doc: docs/superpowers/specs/2026-06-21-task-duration-and-status-v1-2-design.md
base-ref: 2622ad2ef2892eb7ee98187d2e15775bc4c5e3ca

## 文件清单（封闭范围，不改无关代码）

- 修改：`web/src/features/project/dashboardMetrics.ts`
- 修改：`web/src/features/project/TaskDetailTable.tsx`
- 修改：`web/src/features/project/RiskTaskStrip.tsx`
- 修改：`web/src/styles.css`
- 修改：`web/src/features/project/dashboardMetrics.test.ts`
- 修改：`web/src/features/project/TaskDetailTable.test.tsx`

## Task 1: 类型与派生——启动偏差标签

**Files:**
- Modify: `web/src/features/project/dashboardMetrics.ts`
- Test: `web/src/features/project/dashboardMetrics.test.ts`

- [x] **Step 1: 写失败测试——启动偏差**

追加测试覆盖延迟启动/提前启动/相等/无实际开始四种情况，断言新导出函数 `getStartDeviationLabel(task)`。预期：延迟启动返回 `"延迟启动"`，提前返回 `"提前启动"`，相等与无实际开始返回 `undefined`。

- [x] **Step 2: 运行测试确认失败**

Run: `cd web && npx vitest run dashboardMetrics`
Expected: FAIL（`getStartDeviationLabel` 未导出）

- [x] **Step 3: 实现 `getStartDeviationLabel`**

在 `dashboardMetrics.ts` 新增导出函数：

```ts
export function getStartDeviationLabel(task: ProjectTask): string | undefined {
  if (!task.actualStartDate) return undefined;
  const cmp = compareDate(task.actualStartDate, task.plannedStartDate);
  if (cmp > 0) return "延迟启动";
  if (cmp < 0) return "提前启动";
  return undefined;
}
```

`compareDate` 已存在于文件内。

- [x] **Step 4: 运行测试确认通过**

Run: `cd web && npx vitest run dashboardMetrics`
Expected: PASS

- [x] **Step 5: 提交**

```bash
git add web/src/features/project/dashboardMetrics.ts web/src/features/project/dashboardMetrics.test.ts
git commit -m "feat(metrics): add start deviation label"
```

## Task 2: 类型与派生——已完成结束偏差标签

**Files:**
- Modify: `web/src/features/project/dashboardMetrics.ts`
- Test: `web/src/features/project/dashboardMetrics.test.ts`

- [x] **Step 1: 写失败测试——已完成结束偏差**

追加测试覆盖超期/提前/相等/未完成四种情况，断言 `getCompletionDeviationLabel(task)`。用例：计划结束 2026-04-13、实际结束 2026-04-30 → `超期17天`；计划结束 2026-04-27、实际结束 2026-04-25 → `提前2天`；相等 → `undefined`；无实际结束 → `undefined`。

口径核对：`calculateCalendarDays("2026-04-13","2026-04-30")` = 18，减 1 = 17。

- [x] **Step 2: 运行测试确认失败**

Run: `cd web && npx vitest run dashboardMetrics`
Expected: FAIL（`getCompletionDeviationLabel` 未导出）

- [x] **Step 3: 实现 `getCompletionDeviationLabel`**

```ts
export function getCompletionDeviationLabel(task: ProjectTask): string | undefined {
  if (!task.actualEndDate) return undefined;
  const cmp = compareDate(task.actualEndDate, task.plannedEndDate);
  if (cmp > 0) return `超期${calculateCalendarDays(task.plannedEndDate, task.actualEndDate) - 1}天`;
  if (cmp < 0) return `提前${calculateCalendarDays(task.actualEndDate, task.plannedEndDate) - 1}天`;
  return undefined;
}
```

`calculateCalendarDays` import 已存在于文件顶部。

- [x] **Step 4: 运行测试确认通过**

Run: `cd web && npx vitest run dashboardMetrics`
Expected: PASS

- [x] **Step 5: 提交**

```bash
git add web/src/features/project/dashboardMetrics.ts web/src/features/project/dashboardMetrics.test.ts
git commit -m "feat(metrics): add completion deviation label"
```

## Task 3: 类型与派生——未开始倒计时标签

**Files:**
- Modify: `web/src/features/project/dashboardMetrics.ts`
- Test: `web/src/features/project/dashboardMetrics.test.ts`

- [x] **Step 1: 写失败测试——未开始倒计时**

追加测试覆盖距X天/已超期X天/已开始任务返回 undefined。用例：today 2026-06-19、plannedEnd 2026-06-28 → `"距9天"`；today 2026-06-19、plannedEnd 2026-04-27 → `"已超期52天"`；有实际开始的任务 → `undefined`。

口径（统一 -1，对齐现有 overdueDays）：距 = `calculateCalendarDays(today, plannedEnd) - 1`；已超期 = `calculateCalendarDays(plannedEnd, today) - 1`。

注：原 design.md 3.1 写"距X天含当天"，但用户验收场景"距9天"对应 today=06-19、end=06-28（含当天 10 天），故按验收场景采用 -1 口径，归档前回写 design.md。

- [x] **Step 2: 运行测试确认失败**

Run: `cd web && npx vitest run dashboardMetrics`
Expected: FAIL

- [x] **Step 3: 实现 `getNotStartedCountdownLabel`**

```ts
export function getNotStartedCountdownLabel(task: ProjectTask, today: string): string | undefined {
  if (task.actualStartDate) return undefined;
  const cmp = compareDate(today, task.plannedEndDate);
  if (cmp > 0) return `已超期${calculateCalendarDays(task.plannedEndDate, today) - 1}天`;
  if (cmp < 0) return `距${calculateCalendarDays(today, task.plannedEndDate) - 1}天`;
  return "今日到期";
}
```

today === plannedEnd 时返回"今日到期"，与 `warningState: due-today` 语义一致。

- [x] **Step 4: 运行测试确认通过**

Run: `cd web && npx vitest run dashboardMetrics`
Expected: PASS

- [x] **Step 5: 提交**

```bash
git add web/src/features/project/dashboardMetrics.ts web/src/features/project/dashboardMetrics.test.ts
git commit -m "feat(metrics): add not-started countdown label"
```

## Task 4: 类型与派生——`riskLabels` 组装与模型替换

**Files:**
- Modify: `web/src/features/project/dashboardMetrics.ts`
- Test: `web/src/features/project/dashboardMetrics.test.ts`

- [x] **Step 1: 写失败测试——`getRiskLabels` 组装**

覆盖各阶段组合：未开始距9天 → `["未开始（距9天）"]`；未开始当日到期 → `["未开始（今日到期）"]`；进行中延迟启动+延期2天 → `["延迟启动","延期2天"]`；已完成延迟启动+超期17天 → `["延迟启动","超期17天"]`；已完成无偏差 → `["已完成"]`。同步：现有引用 `task.riskLabel` 的断言改为 `task.riskLabels`（数组形式）。

- [x] **Step 2: 运行测试确认失败**

Run: `cd web && npx vitest run dashboardMetrics`
Expected: FAIL（`riskLabel` 字段不存在、`getRiskLabels` 未导出）

- [x] **Step 3: 重构 `getRiskLabel` → `getRiskLabels`，改 `DashboardTask` 字段**

在 `DashboardTask` 接口将 `riskLabel?: string` 改为 `riskLabels: string[]`。新增 `getLiveWarningLabel`（抽取现有进行中预警）与 `getRiskLabels`：

```ts
function getLiveWarningLabel(task: ProjectTask): string | undefined {
  if (task.warningState === "overdue") return `延期${task.overdueDays ?? 0}天`;
  if (task.warningState === "due-today") return "今日到期";
  if (task.warningState === "within-week") return "7日内到期";
  return undefined;
}

export function getRiskLabels(task: ProjectTask, today: string): string[] {
  const status = getDashboardStatus(task, today);
  const startLabel = getStartDeviationLabel(task);
  if (status === "not-started") {
    const countdown = getNotStartedCountdownLabel(task, today);
    return countdown ? [`未开始（${countdown}）`] : ["未开始"];
  }
  if (status === "in-progress") {
    const live = getLiveWarningLabel(task);
    return [startLabel, live].filter((x): x is string => Boolean(x));
  }
  const completion = getCompletionDeviationLabel(task);
  const labels = [startLabel, completion].filter((x): x is string => Boolean(x));
  return labels.length ? labels : ["已完成"];
}
```

`buildDashboardModel` 中 `riskLabel: getRiskLabel(task)` 改为 `riskLabels: getRiskLabels(task, today)`。删除旧 `getRiskLabel`（逻辑已拆分）。`isRiskTask` 维持现有显式判定不变。

- [x] **Step 4: 运行测试确认通过**

Run: `cd web && npx vitest run`
Expected: 全部 PASS（含被改的现有断言）

- [x] **Step 5: 提交**

```bash
git add web/src/features/project/dashboardMetrics.ts web/src/features/project/dashboardMetrics.test.ts
git commit -m "refactor(metrics): assemble multi-label riskLabels"
```

## Task 5: 表格组件——工期列与状态多标签

**Files:**
- Modify: `web/src/features/project/TaskDetailTable.tsx`
- Test: `web/src/features/project/TaskDetailTable.test.tsx`

- [x] **Step 1: 写失败测试——工期列与状态渲染**

追加：计划工期列含 `21天`；实际工期列在仅开始任务显示 `进行中`、未开始任务显示 `-`；状态列对延迟启动+超期任务渲染 `延迟启动、超期17天` 文本；无偏差已完成任务渲染 `已完成`。

- [x] **Step 2: 运行测试确认失败**

Run: `cd web && npx vitest run TaskDetailTable`
Expected: FAIL（新列不存在、`riskLabel` 字段缺失）

- [x] **Step 3: 改 `TaskDetailTable.tsx`**

表头：在"计划周期"后加 `<th>计划工期</th>`，在"实际周期"后加 `<th>实际工期</th>`。行体对应位置加单元格。计划工期：`{task.plannedDurationDays}天`。实际工期：

```tsx
<td className="duration-cell">
  {task.actualStartDate && task.actualEndDate
    ? `${task.actualDurationDays}天`
    : task.actualStartDate
      ? "进行中"
      : "-"}
</td>
```

状态单元格改为渲染数组：

```tsx
<td>
  <span className={`status-badge status-${task.dashboardStatus} ${warningClass(task)}`}>
    {task.riskLabels.length ? task.riskLabels.join("、") : task.statusLabel}
  </span>
</td>
```

`warningClass` 与 `actualPeriod` 函数保持不变（`actualPeriod` 仍用于"实际周期"列文案）。

- [x] **Step 4: 运行测试确认通过**

Run: `cd web && npx vitest run TaskDetailTable`
Expected: PASS

- [x] **Step 5: 提交**

```bash
git add web/src/features/project/TaskDetailTable.tsx web/src/features/project/TaskDetailTable.test.tsx
git commit -m "feat(table): add duration columns and multi-label status"
```

## Task 6: 风险任务条——同步 `riskLabels`

**Files:**
- Modify: `web/src/features/project/RiskTaskStrip.tsx`
- Test: 若存在 `RiskTaskStrip` 测试则同步，否则跳过测试步骤

- [x] **Step 1: 改 `RiskTaskStrip.tsx`**

`warningClass` 改为基于标签内容判定：

```tsx
function warningClass(task: DashboardTask): string {
  const text = task.riskLabels.join("");
  if (/超期|延期|已超期/.test(text)) return "warning-overdue";
  if (/延迟启动|今日到期|7日内到期/.test(text)) return "warning-start-delayed";
  if (/提前/.test(text)) return "warning-early";
  return `warning-${task.warningState}`;
}
```

`<em>` 渲染改为 `{task.riskLabels.join("、")}`。

- [x] **Step 2: 运行相关测试**

Run: `cd web && npx vitest run`
Expected: 全部 PASS

- [x] **Step 3: 提交**

```bash
git add web/src/features/project/RiskTaskStrip.tsx
git commit -m "refactor(risk-strip): adapt to riskLabels array"
```

## Task 7: 样式——四档配色与工期列

**Files:**
- Modify: `web/src/styles.css`

- [x] **Step 1: 改 `styles.css`**

新增工期列样式与多标签 span 类：

```css
.duration-cell {
  text-align: right;
  white-space: nowrap;
}

.tag-early {
  background: #edf7ee;
  border: 1px solid #5fae6b;
  color: #2f6b3f;
}

.tag-delayed-start,
.tag-warning {
  background: #fff7db;
  border: 1px solid #e0b341;
  color: #735500;
}

.tag-overdue {
  background: #fff1ed;
  border: 1px solid #db6b5f;
  color: #8b3f35;
}

.tag-neutral {
  background: transparent;
  border: 1px solid transparent;
  color: #333;
}
```

修改 `.warning-start-delayed` 配色，将原合并规则

```css
.warning-overdue,
.warning-start-delayed {
  background: #fff1ed;
  border-color: #db6b5f;
  color: #8b3f35;
}
```

拆为：

```css
.warning-overdue {
  background: #fff1ed;
  border-color: #db6b5f;
  color: #8b3f35;
}

.warning-start-delayed {
  background: #fff7db;
  border-color: #e0b341;
  color: #735500;
}
```

延迟启动归黄系，与超期红橙区分。多标签着色落在子 span 的 `.tag-*` 类上。

- [x] **Step 2: 运行样式相关测试**

Run: `cd web && npx vitest run styles`
Expected: PASS（若无 styles 测试则跳过）

- [x] **Step 3: 运行全量测试**

Run: `cd web && npx vitest run`
Expected: 全部 PASS

- [x] **Step 4: 提交**

```bash
git add web/src/styles.css
git commit -m "style: multi-label colors and duration column"
```

## Task 8: 多标签 span 着色渲染细化

**Files:**
- Modify: `web/src/features/project/TaskDetailTable.tsx`
- Modify: `web/src/features/project/RiskTaskStrip.tsx`

- [x] **Step 1: 改状态单元格为逐标签 span 着色**

在 `TaskDetailTable.tsx` 新增标签→类名映射辅助，状态单元格渲染为多个带类名的 span，用顿号文本节点分隔：

```tsx
function tagClass(label: string): string {
  if (/提前/.test(label)) return "tag-early";
  if (/超期|延期|已超期/.test(label)) return "tag-overdue";
  if (/延迟启动|今日到期|7日内到期/.test(label)) return "tag-warning";
  return "tag-neutral";
}
```

渲染：`task.riskLabels` 长度 > 0 时，按标签拆 span，相邻标签间插入 `、` 文本；为空时回退 `statusLabel`（`tag-neutral`）。`RiskTaskStrip.tsx` 的 `<em>` 同样按标签拆 span 渲染，保持一致。

"未开始（已超期52天）"这种含括号的复合标签整体作为一个标签字符串处理，`tagClass` 对含"已超期"的返回 `tag-overdue`。

- [x] **Step 2: 运行全量测试**

Run: `cd web && npx vitest run`
Expected: 全部 PASS

- [x] **Step 3: 视觉验证**

Run: `cd web && npm run build`，确认构建通过。必要时本地起 dev server 目检多标签着色。

- [x] **Step 4: 提交**

```bash
git add web/src/features/project/TaskDetailTable.tsx web/src/features/project/RiskTaskStrip.tsx
git commit -m "feat(ui): per-label colored spans for multi-label status"
```

## Task 9: 回归验证

- [x] **Step 1: 全量测试**

Run: `cd web && npx vitest run`
Expected: 全部 PASS（基线 91 测试 + 本次新增）

- [x] **Step 2: 构建**

Run: `cd web && npm run build`
Expected: PASS

- [x] **Step 3: Claude Code 审查**

交由 Claude Code 对本次改动 diff 做审查（正确性、边界、安全）。

- [x] **Step 4: 勾选 tasks.md 全部任务**

编辑 `openspec/changes/task-duration-and-status-v1-2/tasks.md`，将 6 组任务全部勾选 `[x]`。

- [x] **Step 5: 提交**

```bash
git add openspec/changes/task-duration-and-status-v1-2/tasks.md
git commit -m "chore: complete v1.2 tasks"
```
