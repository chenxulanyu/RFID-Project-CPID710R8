# Claude Code 审查指令：task-duration-and-status-v1-2

请作为只读 Reviewer 审查本次 V1.2 的两项改进：任务明细表新增计划工期/实际工期两列，状态列从单标签改为多标签组合。以下是开发内容概要：

## 改动汇总（7 文件，+595/-14 行）

分支：`feature/20260621/task-duration-and-status-v1-2`，base `2622ad2`，HEAD `973163e`

### 1. 数据派生层重构（dashboardMetrics.ts）

- [dashboardMetrics.ts](/Users/mac/Vibe%20Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/dashboardMetrics.ts)：`DashboardTask.riskLabel: string` 改为 `riskLabels: string[]`
- 新增 `getStartDeviationLabel(task)`：实际开始晚于计划开始 → 延迟启动；早于 → 提前启动；相等或无实际开始 → undefined
- 新增 `getCompletionDeviationLabel(task)`：仅已完成任务。实际结束晚于计划结束 → 超期X天；早于 → 提前X天；相等 → undefined。天数口径 `calculateCalendarDays - 1`
- 新增 `getNotStartedCountdownLabel(task, today)`：仅未开始任务。today < plannedEnd → 距X天；today = plannedEnd → 今日到期；today > plannedEnd → 已超期X天。距与已超期统一 -1 口径，对齐现有 overdueDays
- 旧 `getRiskLabel` 拆为 `getLiveWarningLabel`（进行中实时预警）+ `getRiskLabels`（按阶段组装有序数组）。`isRiskTask` 维持现有显式判定不变（避免未开始未到期任务误入风险条）

### 2. 表格组件（TaskDetailTable.tsx）

- 表头在"计划周期"后插"计划工期"列，在"实际周期"后插"实际工期"列
- 计划工期单元格：`{task.plannedDurationDays}天`
- 实际工期单元格：有开始+结束 → 天数；仅有开始 → 进行中；无开始 → -
- 状态单元格改为逐标签 span 渲染，每个 span 带 `tagClass` 类，顿号分隔；空数组回退 statusLabel

### 3. 风险任务条（RiskTaskStrip.tsx）

- `warningClass` 改为基于标签内容判定（超期/延期/已超期 → 红；延迟启动/临期 → 黄；提前 → 绿）
- `<em>` 改为逐标签 span 渲染，复用 TaskDetailTable 导出的 `tagClass`

### 4. 样式（styles.css）

- 新增 `.duration-cell`（右对齐、nowrap）
- 新增 `.tag-early`（绿）、`.tag-delayed-start`/`.tag-warning`（黄）、`.tag-overdue`（红橙）、`.tag-neutral`（透明）四档配色
- `.warning-start-delayed` 从红橙拆出改为黄，与超期红橙区分；新增 `.warning-early`（绿）

### 5. 测试

- dashboardMetrics.test.ts：+20 个单测（启动偏差、结束偏差、倒计时、多标签组装、顺序、回退）
- TaskDetailTable.test.tsx：+7 个组件测试（工期列、多标签 span、回退、提前着色）
- styles.test.ts：更新 `.warning-start-delayed` 黄色断言，补充多标签配色与工期列断言

## 验证结果

- `npx vitest run`：121/121 通过（基线 91 + 新增 30）
- `npm run build`：通过

## 审查重点

1. 三个新函数的天数口径（`calculateCalendarDays - 1`）是否与现有 `overdueDays` 完全一致，边界（today=plannedEnd 当日、实际结束=计划结束同日）是否正确
2. `getRiskLabels` 各阶段组装是否有遗漏场景：未开始/进行中/已完成的标签组合是否覆盖全部情况，空数组回退是否正确
3. 多标签渲染的 `flatMap` 顿号分隔逻辑是否会产生多余的顿号或 key 冲突
4. `riskLabel` 字段重命名为 `riskLabels` 是否有遗漏的引用点（已全局搜索无残留，请复核）
5. `.warning-start-delayed` 配色从红橙改黄是否影响其他依赖该类的组件或测试
6. `tagClass` 对"未开始（已超期53天）"这种含括号复合标签的判定是否正确（应归 tag-overdue）
7. 是否有改动触及无关代码（本次要求严格限定在 6 个文件范围）

## 审查报告

请将审查报告写入 `00_AI协作工作区/04_双AI审查/Claude审查-task-duration-and-status-v1-2-v1.0.md`，结论标明 通过/有条件通过/不通过。
