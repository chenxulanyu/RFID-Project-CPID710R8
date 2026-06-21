# Claude审查-dashboard-status-responsive-polish-v1.0

**审查日期**：2026-06-21
**被审查版本**：dashboard-status-responsive-polish
**审查者**：Claude Code（只读 Reviewer）
**分支**：`feature/20260621/dashboard-status-responsive-polish`

---

## Summary

- **整体判断**：✅ **通过**
- **一句话结论**：6 项需求全部正确实现，延迟启动/未启动新逻辑互斥且边缘覆盖完整，KPI 铺满宽度且移动端保持单排，admin 滚动统一约束，测试覆盖 6 个需求边界。1 个 Minor 建议。

---

## 逐项审查

### 1. 延迟启动逻辑（需求 2 + 需求 6） ✅

[dashboardMetrics.ts:48-50](web/src/features/project/dashboardMetrics.ts#L48-L50)

```typescript
function hasDelayedActualStart(task: ProjectTask): boolean {
  return Boolean(task.actualStartDate && compareDate(task.actualStartDate, task.plannedStartDate) > 0);
}
```

**新定义**：任务有实际开始时间，且实际开始 > 计划开始 → 延迟启动。

对比旧逻辑：
- 旧：`compareDate(task.plannedStartDate, today) < 0` — 仅比较计划开始与今天，无论是否已开始
- 新：必须有 `actualStartDate` + 晚于计划日期 → 基于实际行为而非预期

**状态判定链**（`getDashboardStatus` L52-59）：

```
1. actualEndDate 存在 → finished（即使有延迟启动，状态优先为已完成）
2. hasDelayedActualStart → start-delayed（有实际开始但晚了）
3. actualStartDate 存在 → in-progress（有实际开始且不晚）
4. elapsedDays === "finished" → finished（遗留兼容）
5. 否则 → not-started（无实际开始数据）
```

**互斥性验证**：

| actualEndDate | actualStart | actual vs plan | 状态 | startDelayed 指标 | risk 展示 |
|---|---|---|---|---|---|
| ✅ | ≤plan | ≤plan | finished | 0 | 取决于 warning |
| ✅ | >plan | >plan | **finished** | **1** ✅ | **计入** ✅ |
| ❌ | >plan | >plan | start-delayed | 1 | 计入 |
| ❌ | ≤plan | ≤plan | in-progress | 0 | 取决于 warning |
| ❌ | ❌ | N/A | not-started | 0 | 不计入 |

- `finished` / `in-progress` / `start-delayed` / `not-started` 互斥 ✅
- 已完成任务不会被误标为延迟启动状态 ✅

#### 已完成但延迟启动计入风险（需求 6）

[L159](web/src/features/project/dashboardMetrics.ts#L159)：`startDelayedTasks` 指标改用 `filter(hasDelayedActualStart)` 而非 `filter(dashboardStatus === "start-delayed")`。

这确保已完成任务若 `actualStartDate > plannedStartDate`，虽 status 为 `finished`，但仍计入 `startDelayedTasks` 和 `riskTasks`。

[L79-87](web/src/features/project/dashboardMetrics.ts#L79-L87)：`isRiskTask` 新增 `hasDelayedActualStart(task) ||` 分支。

[L75](web/src/features/project/dashboardMetrics.ts#L75)：`getRiskLabel` 新增 `hasDelayedActualStart(task) ||` 前缀。

测试验证 [dashboardMetrics.test.ts:133-157](web/src/features/project/dashboardMetrics.test.ts#L133-L157)：

```typescript
// finishedTasks=1, startDelayedTasks=1, riskTasks含finished-late-start, status=finshed, riskLabel=延迟启动
```

全部断言通过 ✅

### 2. 未启动逻辑（需求 4） ✅

**新旧对比**：

| 旧逻辑 | 新逻辑 |
|---|---|
| `plannedStartDate < today` → start-delayed | 无实际开始 → not-started |
| `elapsedDays > 0` → in-progress | `elapsedDays` 不再驱动状态 |

`getDashboardStatus` 末端 `return "not-started"` 捕获所有无 `actualStartDate` 且无 `actualEndDate` 且无 `elapsedDays==="finished"` 的任务 ✅

测试 [dashboardMetrics.test.ts:223-253](web/src/features/project/dashboardMetrics.test.ts#L223-L253)：
- `legacy-active`（elapsedDays=4，无 actualStartDate）→ not-started（旧逻辑为 in-progress）✅
- `legacy-finished`（actualEndDate 存在）→ finished（不受影响）✅

边界覆盖 [dashboardMetrics.test.ts:102-131](web/src/features/project/dashboardMetrics.test.ts#L102-L131)：
- 提前启动（actualStartDate < plannedStartDate）→ in-progress，不计入延迟 ✅
- 按时启动（actualStartDate === plannedStartDate）→ in-progress，不计入延迟 ✅

### 3. KPI CSS 铺满宽度 + 移动横屏单排（需求 1 + 5） ✅

[styles.css:110-116](web/src/styles.css#L110-L116)

```css
.metric-grid {
  grid-template-columns: repeat(7, minmax(128px, 1fr));
  justify-content: stretch;
  overflow-x: auto;
  width: 100%;
}
```

| 维度 | 值 |
|---|---|
| 列数 | 7 列固定 |
| 分配 | `minmax(128px, 1fr)` — 最小 128px，剩余空间均分 |
| 宽度 | `width: 100%` — 填满 `.dashboard-page` 容器 |
| 溢出 | `overflow-x: auto` — 窄屏水平滚动 |
| 对齐 | `justify-content: stretch` — 列拉伸填满 |

对比旧 CSS：
```css
/* 旧 */
grid-template-columns: repeat(7, minmax(min-content, max-content));
justify-content: start;
/* max-content → 列宽仅随内容 → 卡片收缩，右侧留白 */
```

**移动端媒体查询**：

| 断点 | 旧 | 新 |
|---|---|---|
| ≤1100px | `repeat(3, 1fr)` → 2行 | `repeat(7, minmax(118px, 1fr))` → 单排横滚 ✅ |
| ≤760px | `repeat(2, 1fr)` → 4行 | `repeat(7, minmax(112px, 1fr))` → 单排横滚 ✅ |

CSS 测试 [styles.test.ts:13-16](web/src/styles.test.ts#L13-L16)：
- 断言移动媒体查询**不含** `repeat(2,` ✅
- 断言移动媒体查询**含有** `repeat(7, minmax(112px, 1fr))` ✅

### 4. Admin 活跃任务列表滚动（需求 3） ✅

[styles.css:467-472](web/src/styles.css#L467-L472)

```css
.admin-layout > .admin-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(100vh - 220px);  /* 新增 */
  min-height: 0;
}
```

[styles.css:664-668](web/src/styles.css#L664-L668) 移动端：

```css
.admin-task-list {
  align-content: start;
  flex: 1;           /* 从 flex: initial 改为 flex: 1 */
  max-height: none;
}
```

**约束链**：

```
aside.admin-panel (flex column, height: 100%)
  └─ max-height: calc(100vh - 220px)  ← 限制整体高度
       ├─ .section-heading-row         ← 固定
       ├─ .admin-actions               ← 固定
       └─ .admin-task-list (flex: 1)   ← 占剩余空间
            └─ overflow: auto          ← 超过时内部滚动
```

- 活跃任务和已归档任务共用同一套 CSS 约束 ✅
- `max-height` 限制左侧面板总高，`flex: 1` 让列表占满剩余，`overflow: auto` 处理溢出 ✅
- 220px 约等于顶栏（~120px）+ 标题（~60px）+ 间距 → 合理预估 ✅
- 移动端 `flex: 1`（原 `flex: initial`）确保列表撑满可用高度 ✅

### 5. 范围控制 ✅

| 不应修改 | 状态 |
|---|---|
| CloudBase env/accessKey/集合名/安全域名 | ✅ 未触及 |
| 部署配置（.coze / 根 package.json / web/package.json） | ✅ 未触及 |
| AdminPage.tsx / projectService.ts / projectValidation.ts | ✅ 未触及 |
| 恢复资料目录 | ✅ 未触及 |

改动严格限于 5 个源代码文件 + 1 个测试：
- `dashboardMetrics.ts` + `.test.ts`：状态逻辑
- `styles.css` + `styles.test.ts`：布局
- `DashboardPage.test.tsx`：KPI 顺序验证

**新增文件**（`??` untracked）：Comet 工作区产物（plan / design / proposal / tasks），属正确流程产物 ✅

### 6. 测试覆盖 ✅

| 需求 | 测试 | 文件 |
|---|---|---|
| 1. KPI 宽度 | "uses seven width-filling metric card columns on desktop" | styles.test.ts |
| 2. 延迟启动 | "derives task status counts including delayed starts" | dashboardMetrics.test.ts |
| 2. 按时/提前不算延迟 | "does not count tasks with on-time or early actual starts as delayed starts" | dashboardMetrics.test.ts |
| 3. Admin 滚动 | "keeps the admin task list bounded with internal scrolling" | styles.test.ts |
| 4. 未启动 | "does not infer active status from elapsed days when actual start is missing" | dashboardMetrics.test.ts |
| 5. 移动单排 | "keeps the metric grid as one row on mobile layout" | styles.test.ts |
| 6. 已完成延迟计入 | "counts completed tasks with late actual starts in delayed-start metrics" | dashboardMetrics.test.ts |

89/89 测试通过 ✅

---

## Minor Issues

### Minor 1. `getDashboardStatus` 的 `today` 参数已不再使用

[dashboardMetrics.ts:52-53](web/src/features/project/dashboardMetrics.ts#L52-L53)

```typescript
export function getDashboardStatus(task: ProjectTask, today: string): DashboardTaskStatus {
  void today;
```

`today` 参数在新逻辑中完全未被使用（旧逻辑曾用它比较 `plannedStartDate < today` 来判定延迟启动）。`void today` 仅用于抑制 TypeScript unused 警告。

建议：后续 BREAKING CHANGE 窗口移除参数。当前保留保持 API 兼容，可接受。

---

## 测试与构建

| 命令 | 结果 |
|---|---|
| `npm test --workspace web` | ✅ **89/89 通过**（14 文件，1.48s） |
| `npm run build --workspace web` | ✅ 通过 |
| `openspec validate dashboard-status-responsive-polish --strict` | ✅ 通过 |
| `openspec validate --specs --strict` | ✅ 7/7 通过 |

---

## 结论

✅ **通过**。6 项需求全部正确实现：

- 延迟启动改为基于实际开始 vs 计划开始的比较，互斥逻辑完整
- 已完成但延迟启动的任务状态保持 `finished`，同时正确计入延迟启动指标和风险展示
- KPI 7 卡 `width: 100%` + `1fr` 填满宽度，移动端 `repeat(7, …)` 保持单排横滚
- Admin 列表添加 `max-height` + `flex: 1` + `overflow: auto` 统一约束活跃/归档列表高度
- 测试覆盖 6 个需求全部边界
- 未触及 CloudBase、部署配置、无关文件

1 个 Minor：`getDashboardStatus` 的 `today` 参数已废弃，可后续清理。
