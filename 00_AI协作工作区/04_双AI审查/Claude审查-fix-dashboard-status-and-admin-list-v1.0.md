# Claude审查-fix-dashboard-status-and-admin-list-v1.0

**审查日期**：2026-06-21
**被审查版本**：fix-dashboard-status-and-admin-list
**审查者**：Claude Code（只读 Reviewer）
**分支**：`feature/20260621/fix-dashboard-status-and-admin-list`

---

## Summary

- **整体判断**：✅ **通过**
- **一句话结论**：3 个修复全部正确——生命周期状态精简为 3 态闭合，延迟启动独立为风险维度，admin 列表移除 max-height 约束恢复自然高度，范围控制严格。

---

## 逐项审查

### 1. 生命周期状态精简为 3 态 ✅

[dashboardMetrics.ts:4](web/src/features/project/dashboardMetrics.ts#L4)

```typescript
export type DashboardTaskStatus = "finished" | "in-progress" | "not-started";
```

`getDashboardStatus`（L52-57）简化为：

```typescript
if (task.actualEndDate) return "finished";
if (task.actualStartDate) return "in-progress";
return "not-started";
```

- `start-delayed` 不再作为生命周期状态 ✅
- 移除了 `elapsedDays === "finished"` 兜底分支（actualEndDate 已覆盖此场景）✅
- 三个状态互斥且穷尽：actualEndDate → finished / actualStartDate → in-progress / else → not-started ✅

### 2. 闭合性验证 ✅

[dashboardMetrics.test.ts:91-93](web/src/features/project/dashboardMetrics.test.ts#L91-L93) + [L156-158](web/src/features/project/dashboardMetrics.test.ts#L156-L158)

```typescript
expect(
  model.metrics.finishedTasks + model.metrics.inProgressTasks + model.metrics.notStartedTasks,
).toBe(model.metrics.totalDetailTasks);
```

在两个关键测试中均添加闭合性断言 ✅

**逻辑证明**：`getDashboardStatus` 返回且仅返回 `finished | in-progress | not-started`，三个 `filter` 分别匹配这三个值，故 `finishedTasks + inProgressTasks + notStartedTasks === totalDetailTasks` 成立。

**延迟启动 KPI 独立性**：[dashboardMetrics.ts:162](web/src/features/project/dashboardMetrics.ts#L162)

```typescript
startDelayedTasks: dashboardTasks.filter(hasDelayedActualStart).length,
```

`hasDelayedActualStart` 基于 `actualStartDate > plannedStartDate` 判定，与生命周期状态无关。已完成但延迟启动的任务 status=finished（计入 finishedTasks），同时 hasDelayedActualStart=true（计入 startDelayedTasks）。**两个维度正交，不冲突** ✅

| 场景 | dashboardStatus | finishedTasks | inProgressTasks | notStartedTasks | startDelayedTasks |
|---|---|---|---|---|---|
| 已完成且按时 | finished | +1 | — | — | 0 |
| 已完成但延迟 | finished | +1 | — | — | +1 |
| 进行中且按时 | in-progress | — | +1 | — | 0 |
| 进行中但延迟 | in-progress | — | +1 | — | +1 |
| 未启动 | not-started | — | — | +1 | 0 |

### 3. 延迟启动风险样式 ✅

#### RiskTaskStrip

[RiskTaskStrip.tsx:3-5](web/src/features/project/RiskTaskStrip.tsx#L3-L5)

```typescript
function warningClass(task: DashboardTask): string {
  return task.riskLabel === "延迟启动" ? "warning-start-delayed" : `warning-${task.warningState}`;
}
```

#### TaskDetailTable

[TaskDetailTable.tsx:9-11](web/src/features/project/TaskDetailTable.tsx#L9-L11)

```typescript
function warningClass(task: DashboardTask): string {
  return task.riskLabel === "延迟启动" ? "warning-start-delayed" : `warning-${task.warningState}`;
}
```

**关键问题**：延迟启动的任务 `warningState` 通常是 `"none"`（不延期、不临期）。旧代码用 `warning-${task.warningState}` → `warning-none` → 白色风险卡（无背景色）。新代码检测 `riskLabel === "延迟启动"` → 切换为 `warning-start-delayed` → 暖色样式 ✅

#### CSS

[styles.css:296-300](web/src/styles.css#L296-L300)

```css
.warning-overdue,
.warning-start-delayed {
  background: #fff1ed;
  border-color: #db6b5f;
  color: #8b3f35;
}
```

- 旧 `.status-start-delayed` 已删除 ✅
- 新 `.warning-start-delayed` 与 `.warning-overdue` 共享暖色样式 ✅
- 延迟启动风险卡不再出现白色卡片 ✅

#### 两个 `warningClass` 函数重复

[RiskTaskStrip.tsx:3-5](web/src/features/project/RiskTaskStrip.tsx#L3-L5) 和 [TaskDetailTable.tsx:9-11](web/src/features/project/TaskDetailTable.tsx#L9-L11) 有完全相同的实现。可提取为共享工具函数，但当前各 3 行，重复可接受。Minor。

### 4. Admin 列表 max-height 移除 ✅

[styles.css diff]：移除 `max-height: calc(100vh - 220px)`

**修复前问题**：`max-height: calc(100vh - 220px)` 硬编码视口偏移，不同屏幕/缩放下 220px 估算不准确，导致列表高度与右侧面板不对齐。

**修复后**：仅保留 `height: 100%` + `min-height: 0`（已有），让 `.admin-layout` 的 grid 行高度自然决定左侧面板高度，`.admin-task-list` 的 `flex: 1` + `overflow: auto` 处理内部滚动 ✅

测试 [styles.test.ts:24-27](web/src/styles.test.ts#L24-L27)：
- 断言不含 `max-height: calc(100vh - 220px)` ✅
- 断言含 `height: 100%` + `min-height: 0` ✅
- 断言 `.admin-task-list` 含 `overflow: auto` ✅

### 5. 范围控制 ✅

| 不应修改 | 状态 |
|---|---|
| CloudBase 持久化 | ✅ 未触及 |
| 部署配置（.coze / package.json） | ✅ 未触及 |
| seed 数据 | ✅ 未触及 |
| 远端仓库 | ✅ 未触及 |
| 用户资料目录 | ✅ 未触及 |
| AdminPage.tsx / ProjectSummaryDashboard.tsx / ProjectTimeline.tsx | ✅ 未触及 |

改动严格限于 5 个文件 + 审查报告更新：
- `dashboardMetrics.ts` + `.test.ts`：状态逻辑精简
- `RiskTaskStrip.tsx` + `TaskDetailTable.tsx`：风险样式
- `styles.css` + `styles.test.ts`：CSS 修复

---

## Minor Issues

### Minor 1. `warningClass` 函数在两个组件中重复

[RiskTaskStrip.tsx:3-5](web/src/features/project/RiskTaskStrip.tsx#L3-L5) 和 [TaskDetailTable.tsx:9-11](web/src/features/project/TaskDetailTable.tsx#L9-L11) 实现完全相同。可提取为 `dashboardMetrics.ts` 的导出工具函数。当前各 3 行，重复可接受。非阻塞。

### Minor 2. `getDashboardStatus` 的 `today` 参数仍保留但未使用

[dashboardMetrics.ts:52](web/src/features/project/dashboardMetrics.ts#L52)：`void today`。参数在状态逻辑中不再使用，保留仅为 API 兼容。非阻塞。

---

## 测试与构建

| 命令 | 结果 |
|---|---|
| `npm test --workspace web` | ✅ **90/90 通过**（14 文件，1.57s） |
| `npm run build --workspace web` | ✅ 通过 |
| `openspec validate fix-dashboard-status-and-admin-list --strict` | ✅ 通过 |
| `openspec validate --specs --strict` | ✅ 7/7 通过 |

---

## 结论

✅ **通过**。3 个修复全部正确：

- 生命周期状态精简为 `finished | in-progress | not-started`，三态闭合 `finishedTasks + inProgressTasks + notStartedTasks = totalDetailTasks`
- 延迟启动独立为风险维度（`hasDelayedActualStart`），通过 `warning-start-delayed` 样式类解决白色风险卡问题
- Admin 列表移除 `max-height: calc(100vh - 220px)`，恢复自然高度 + 内部滚动

无 Blocking 或 Important 问题。2 个 Minor（重复函数、废弃参数）非阻塞。
