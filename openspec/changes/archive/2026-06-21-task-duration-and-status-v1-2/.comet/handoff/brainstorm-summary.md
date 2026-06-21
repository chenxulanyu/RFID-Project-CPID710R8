# Brainstorm Summary

- Change: task-duration-and-status-v1-2
- Date: 2026-06-21

## 确认的技术方案

在 V1.1 已落地基础上，纯前端改动补齐工期列与多标签状态：

1. 工期列：复用 `projectService.ts` 已计算的 `plannedDurationDays`/`actualDurationDays`，表格直接渲染，口径沿用自然日（`calculateCalendarDays`）。实际工期按完备程度显示 天数/进行中/-。
2. 状态多标签：`DashboardTask.riskLabel: string` → `riskLabels: string[]`，由 `getRiskLabels(task, today)` 按阶段组装有序数组。启动偏差标签在前，结束/预警标签在后。数组为空时回退 `statusLabel`。
3. 标签计算分三套：
   - 启动偏差 `getStartDeviationLabel`：延迟启动/提前启动/undefined（适用于进行中+已完成）
   - 已完成结束偏差 `getCompletionDeviationLabel`：超期X天/提前X天/undefined（天数口径 `calculateCalendarDays - 1`）
   - 未开始倒计时 `getNotStartedCountdownLabel`：距X天/已超期X天（已超期口径 `-1`）
   - 进行中实时预警沿用现有 `warningState`+`overdueDays`（今日到期/7日内到期/延期X天）
4. 多标签视觉：逐标签独立色块。正向（提前启动/提前X天）用绿；轻负向（延迟启动/临期预警）用黄；重负向（超期/延期/已超期）用红橙；中性兜底（已完成/进行中/未开始无括号）透明底黑字。
5. `warning-start-delayed` 配色由红橙改为黄，以区分延迟启动（轻）与超期（重）。
6. `RiskTaskStrip` 同步适配 `riskLabels` 数组渲染与 `warningClass` 判定。

## 关键取舍与风险

- `riskLabel → riskLabels` 是破坏性改动，RiskTaskStrip 与测试需同步。Mitigation：同步改渲染与断言。
- 进行中"延期X天"（基于今天）与已完成"超期X天"（基于实际结束日）措辞并存，靠措辞区分语义，已与用户对齐。
- 未开始"已超期X天"与进行中"延期X天"可能混淆，靠"未开始"前缀与括号明确。
- 多标签独立色块视觉较密，但项目管理工具偏密集扫描，信息密度优先于克制。
- 用户明确要求：改动不得触及无关代码，所有改动严格限定在 dashboardMetrics/TaskDetailTable/RiskTaskStrip/styles/测试 范围。

## 测试策略

- 单测：`dashboardMetrics.test.ts` 覆盖启动偏差、已完成结束偏差、未开始倒计时、多标签组合与顺序、无偏差回退。
- 组件测试：`TaskDetailTable.test.tsx` 覆盖计划工期/实际工期列渲染、状态多标签与回退。
- RiskTaskStrip 测试同步适配。
- 回归：全量 vitest + npm run build。

## Spec Patch

无。open 阶段 delta spec 的 8 个 Requirement 与场景已覆盖本次确认的实现细节，无需回写。
