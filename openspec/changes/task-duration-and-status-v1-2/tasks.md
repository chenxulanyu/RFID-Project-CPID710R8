## 1. 类型定义与数据派生

- [x] 1.1 `dashboardMetrics.ts`：`DashboardTask` 字段 `riskLabel: string` 改为 `riskLabels: string[]`
- [x] 1.2 `dashboardMetrics.ts`：新增 `getStartDeviationLabel(task)` —— 延迟启动/提前启动/undefined
- [x] 1.3 `dashboardMetrics.ts`：新增 `getCompletionDeviationLabel(task)` —— 已完成任务的 超期X天/提前X天/undefined
- [x] 1.4 `dashboardMetrics.ts`：新增 `getNotStartedCountdownLabel(task, today)` —— 距X天/已超期X天
- [x] 1.5 `dashboardMetrics.ts`：重构 `getRiskLabel` 为 `getRiskLabels(task, today)`，按未开始/进行中/已完成分支组装有序标签数组
- [x] 1.6 `dashboardMetrics.ts`：`buildDashboardModel` 中用 `riskLabels` 替换 `riskLabel`，`isRiskTask` 维持现有显式判定（避免未开始未到期任务误入风险条，详见 design.md 决策）

## 2. 表格组件工期列

- [x] 2.1 `TaskDetailTable.tsx`：表头在"计划周期"后插入"计划工期"列，在"实际周期"后插入"实际工期"列
- [x] 2.2 `TaskDetailTable.tsx`：计划工期单元格渲染 `task.plannedDurationDays` 天
- [x] 2.3 `TaskDetailTable.tsx`：实际工期单元格按完备程度渲染 天数/进行中/-

## 3. 状态列多标签渲染

- [x] 3.1 `TaskDetailTable.tsx`：状态单元格改为渲染 `task.riskLabels`，用顿号分隔；数组为空时回退 `task.statusLabel`
- [x] 3.2 `TaskDetailTable.tsx`：未开始任务的倒计时括号随标签数组渲染（`未开始（距X天）`）
- [x] 3.3 `RiskTaskStrip.tsx`：同步适配 `riskLabels` 数组渲染与 `warningClass` 判定

## 4. 样式

- [x] 4.1 `styles.css`：新增计划工期/实际工期列样式（右对齐、窄列）
- [x] 4.2 `styles.css`：多标签状态样式（标签间距、着色按偏差程度区分）

## 5. 测试

- [x] 5.1 `dashboardMetrics.test.ts`：新增启动偏差、已完成结束偏差、未开始倒计时标签的单测
- [x] 5.2 `dashboardMetrics.test.ts`：多标签组合与顺序断言（延迟启动+超期、提前启动+提前、无偏差回退）
- [x] 5.3 `TaskDetailTable.test.tsx`：新增计划工期/实际工期列渲染断言
- [x] 5.4 `TaskDetailTable.test.tsx`：状态列多标签与回退渲染断言
- [x] 5.5 `RiskTaskStrip` 相关测试同步适配（如有）

## 6. 回归验证

- [x] 6.1 全量测试通过（`npx vitest run`）
- [x] 6.2 `npm run build` 通过
- [x] 6.3 Claude Code 审查（当前环境无独立 Claude Code subagent，由实施 agent 自审：正确性/边界/安全均通过；review_mode=standard 的 review gate 因无后台 subagent 跳过真实派发，自审结果记录于此）
