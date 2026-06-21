---
comet_change: task-duration-and-status-v1-2
role: technical-design
canonical_spec: openspec
archived-with: 2026-06-21-task-duration-and-status-v1-2
status: final
---

# Design Doc: 任务工期列与多标签状态（V1.2）

## 1. 背景

V1.1 仪表盘已落地。任务明细表当前列序：编号、项目内容、任务名称、计划周期、实际周期、完成比例、状态、责任人、备注。`projectService.ts` 已派生 `plannedDurationDays`/`actualDurationDays` 但表格未展示。状态列经 `dashboardMetrics.ts` 的 `getRiskLabel` 产出单一 `riskLabel: string`，按 延期>今日到期>7日内到期>延迟启动 取首项，无法同时表达启动偏差与结束偏差。

## 2. 目标 / 非目标

**目标**
- 表格补齐计划工期、实际工期两列
- 状态列改为多标签组合，同时呈现启动偏差与结束偏差
- 未开始任务附加距计划结束的倒计时或已超期天数
- 天数口径与现有时间轴/完成比例一致（自然日，`calculateCalendarDays`）

**非目标**
- 不引入工作日换算（`calendarMode` 暂不启用）
- 不改后台表单、数据输入校验、CloudBase 存储、完成比例计算、时间轴渲染
- 不改进行中任务的实时预警语义（今日到期/7日内到期/延期X天 维持现状）
- 不触及上述范围外的无关代码

## 3. 技术方案

### 3.1 类型与数据派生（`dashboardMetrics.ts`）

`DashboardTask.riskLabel: string` → `riskLabels: string[]`。新增三个纯函数 + 重构一个组装函数：

- `getStartDeviationLabel(task)`：实际开始晚于计划开始 → "延迟启动"；早于 → "提前启动"；相等或无实际开始 → `undefined`。适用于进行中与已完成任务。
- `getCompletionDeviationLabel(task)`：仅已完成任务。实际结束晚于计划结束 → `超期${calc(plannedEnd, actualEnd)-1}天`；早于 → `提前${calc(actualEnd, plannedEnd)-1}天`；相等 → `undefined`。
- `getNotStartedCountdownLabel(task, today)`：仅未开始任务。today < plannedEnd → `距${calc(today, plannedEnd)-1}天`；today = plannedEnd → `今日到期`；today > plannedEnd → `已超期${calc(plannedEnd, today)-1}天`。距与已超期统一 -1 口径，对齐现有 `overdueDays`。返回不带"未开始"前缀的括号内容，由渲染层拼装。
- `getRiskLabels(task, today)`：按阶段组装有序数组：
  - 未开始：若有倒计时标签 → `[未开始（${label}）]`，否则 `["未开始"]`
  - 进行中：`[启动偏差?, 实时预警?].filter(Boolean)`
  - 已完成：`[启动偏差?, 结束偏差?].filter(Boolean)`，数组为空时回退 `["已完成"]`

`buildDashboardModel` 中用 `riskLabels` 替换 `riskLabel`。`isRiskTask` 维持现有显式判定（`warningState` 四类 + `hasDelayedActualStart`），不改为 `riskLabels.length`，避免未开始未到期任务因 `["未开始"]` 非空被误入风险条。

### 3.2 表格组件（`TaskDetailTable.tsx`）

- 表头在"计划周期"后插"计划工期"，在"实际周期"后插"实际工期"。
- 计划工期单元格：`{task.plannedDurationDays}天`。
- 实际工期单元格：有开始+结束 → `${actualDurationDays}天`；仅有开始 → "进行中"；无开始 → "-"。
- 状态单元格：渲染 `task.riskLabels`，用顿号连接；空数组回退 `task.statusLabel`。保留 `status-badge` 容器与 `warningClass`。

`actualPeriod` 现有函数保持不变（实际周期列文案不动）。

### 3.3 风险任务条（`RiskTaskStrip.tsx`）

`warningClass` 与 `TaskDetailTable` 共用判定逻辑。`riskLabel` 改 `riskLabels` 后，`<em>` 渲染改为 `task.riskLabels.join("、")`。`warningClass` 改为基于标签内容：含"超期"/"延期"/"已超期" → 红橙；含"延迟启动"/"今日到期"/"7日内到期" → 黄；含"提前" → 绿；否则中性。

### 3.4 样式（`styles.css`）

- 新增 `.duration-cell`：右对齐、窄列、`white-space: nowrap`。
- 新增多标签样式：`.status-badge` 内部用 `<span>` 包裹每个标签，新增 `.tag-early`（绿）、`.tag-delayed-start`（黄）、`.tag-overdue`（红橙）、`.tag-warning`（黄）、`.tag-neutral`（透明底）。
- 修改 `.warning-start-delayed`：由红橙改为黄，与临期同色系，区分延迟启动（轻）与超期（重）。

## 4. 配色映射（逐标签独立色）

| 标签 | 类 | 底/字/边 |
| --- | --- | --- |
| 提前启动 / 提前X天 | `tag-early` | `#edf7ee` / `#2f6b3f` / `#5fae6b` |
| 延迟启动 | `tag-delayed-start` | `#fff7db` / `#735500` / `#e0b341` |
| 今日到期 / 7日内到期 | `tag-warning` | `#fff7db` / `#735500` / `#e0b341` |
| 超期X天 / 延期X天 / 已超期X天 | `tag-overdue` | `#fff1ed` / `#8b3f35` / `#db6b5f` |
| 已完成 / 进行中 / 未开始（无括号） | `tag-neutral` | 透明 / `#333` / 无 |

"未开始（距X天）""未开始（今日到期）""未开始（已超期X天）"整体各作为一个标签字符串：`tagClass` 命中"今日到期"归 `tag-warning`、命中"已超期"归 `tag-overdue`、其余（距X天）归 `tag-neutral`。不拆括号，整个标签串作为一个 span 着色。

## 5. 数据流

```
projectService.deriveTask (已有，不改)
  → plannedDurationDays / actualDurationDays / warningState / overdueDays
dashboardMetrics.buildDashboardModel
  → getRiskLabels(task, today) → riskLabels: string[]
TaskDetailTable
  → 渲染工期列 + 状态多标签
RiskTaskStrip
  → 渲染 riskLabels + warningClass
```

## 6. 风险与取舍

- `riskLabel → riskLabels` 破坏性改动：RiskTaskStrip、测试同步。已在范围清单内。
- "延期"（进行中，基于今天）与"超期"（已完成，基于实际结束日）措辞并存：靠措辞区分，已与用户对齐。
- 未开始"已超期"与进行中"延期"可能混淆：靠"未开始"前缀与括号明确。
- 多标签独立色块视觉较密：项目管理工具偏密集扫描，信息密度优先；配色已限定四档，不过度。
- `isRiskTask` 不改为 `riskLabels.length`，维持显式判定，避免未开始未到期任务误入风险条。

## 7. 测试策略

- `dashboardMetrics.test.ts`：启动偏差（延迟/提前/相等/无实际开始）、已完成结束偏差（超期/提前/相等）、未开始倒计时（距/已超期）、多标签组合与顺序、无偏差回退 `statusLabel`。
- `TaskDetailTable.test.tsx`：计划工期列、实际工期列（天数/进行中/-）、状态多标签渲染、空数组回退。
- `RiskTaskStrip` 测试同步（如存在）。
- 回归：`npx vitest run` 全绿、`npm run build` 通过。

## 8. 范围守则

用户明确要求：改动不得触及无关代码。本次改动文件清单封闭：
`dashboardMetrics.ts`、`TaskDetailTable.tsx`、`RiskTaskStrip.tsx`、`styles.css`、`dashboardMetrics.test.ts`、`TaskDetailTable.test.tsx`、（若存在）`RiskTaskStrip` 测试。不重构、不顺手优化、不改格式化。

## 9. Spec Patch

无。open 阶段 delta spec 8 个 Requirement 已覆盖实现细节，配色与 `isRiskTask` 维持判定属实现决策，不回写 spec。
