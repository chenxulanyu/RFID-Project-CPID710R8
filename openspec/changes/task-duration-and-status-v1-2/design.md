## Context

V1.1 已归档，任务明细表（`TaskDetailTable.tsx`）当前列序为：编号、项目内容、任务名称、计划周期、实际周期、完成比例、状态、责任人、备注。数据派生层 `projectService.ts` 已计算 `plannedDurationDays` 和 `actualDurationDays`，但表格未展示。状态列通过 `dashboardMetrics.ts` 的 `getRiskLabel` 产出单一 `riskLabel: string`，按 延期>今日到期>7日内到期>延迟启动 优先级取第一个命中项，无法同时表达启动偏差与结束偏差。

数据派生已有基础：`elapsedDays`（"not-started" | "finished" | 数字）、`warningState`（overdue/due-today/within-week/future/none）、`overdueDays`（未完成且超期时基于今天的天数）。`getRiskLabel` 的"延期X天"是进行中任务的实时预警，语义上区别于本次要新增的、基于实际结束日的回看"超期X天"。

## Goals / Non-Goals

**Goals:**

- 在表格中直观呈现计划工期与实际工期天数
- 状态列能同时表达启动偏差（延迟/提前启动）与结束偏差（超期/提前X天）
- 未开始任务显示距计划结束的倒计时或已超期天数
- 与现有时间轴、完成比例、天数计算口径保持一致（自然日，`calculateCalendarDays`）

**Non-Goals:**

- 不引入工作日换算（`calendarMode` 字段暂不启用）
- 不改后台表单、数据输入校验、CloudBase 存储
- 不改完成比例计算与时间轴渲染逻辑
- 不改进行中任务的实时预警语义（今日到期/7日内到期/延期X天 维持现状）

## Decisions

### Decision 1: 工期天数复用现有派生字段，不新增计算

`projectService.ts` 的 `deriveTask` 已用 `calculateCalendarDays` 算出 `plannedDurationDays` 和 `actualDurationDays`，口径与时间轴、完成比例一致。表格直接渲染这两个字段即可，避免重复计算导致偏差。

**Alternative**: 在组件内重新计算 → 否决，会与派生层口径分裂。

### Decision 2: `riskLabel: string` → `riskLabels: string[]`，按阶段组装多标签

将 `DashboardTask.riskLabel` 改为 `riskLabels: string[]`，由 `getRiskLabels(task, today)` 按任务阶段组装有序标签数组，保持语义顺序稳定（启动偏差在前，结束/预警在后）。表格状态单元格渲染数组，用顿号分隔；RiskTaskStrip 同步适配。

保留 `statusLabel`（已完成/进行中/未开始）作为兜底：当 `riskLabels` 为空时显示 `statusLabel`。

**Alternative**: 保留 `riskLabel` 单字段、用分隔符拼接 → 否决，样式与语义耦合，不利于逐标签着色。

### Decision 3: 启动偏差独立计算，不依赖 `warningState`

现有 `hasDelayedActualStart` 只判断"晚于"，新增"早于"分支形成 `getStartDeviationLabel`：实际开始晚于计划开始 → 延迟启动；早于 → 提前启动；相等或无实际开始 → undefined。该标签对所有已开始任务（进行中+已完成）都适用。

### Decision 4: 结束偏差按阶段分两套口径

- 进行中任务（无实际结束）：沿用 `warningState` + `overdueDays`（今日到期/7日内到期/延期X天，基于今天）
- 已完成任务（有实际结束）：新增 `getCompletionDeviationLabel`，实际结束晚于计划结束 → 超期X天（`calculateCalendarDays(plannedEnd, actualEnd) - 1`，与现有 `overdueDays` 的 -1 口径一致）；早于 → 提前X天；相等 → undefined
- 未开始任务：新增 `getNotStartedCountdownLabel`，今天 ≤ 计划结束 → 距X天（`calculateCalendarDays(today, plannedEnd)`）；今天 > 计划结束 → 已超期X天（`calculateCalendarDays(plannedEnd, today) - 1`）

**Alternative**: 已完成超期也用"延期X天"措辞 → 否决，与进行中实时预警措辞重合会造成混淆，用户已确认用"超期X天"区分。

### Decision 5: 天数口径统一为 `calculateCalendarDays - 1` 对齐现有 `overdueDays`

现有 `overdueDays = calculateCalendarDays(plannedEnd, today) - 1`，即计划结束次日为超期第1天。新增的已完成超期天数、未开始已超期天数均沿用此口径，保证全表"X天"含义一致。距计划结束天数用 `calculateCalendarDays(today, plannedEnd)`（含当天，今天就是计划结束日 → 距1天，由 `warningState: due-today` 体现"今日到期"）。

## Risks / Trade-offs

- [Risk] `riskLabel` 字段重命名为 `riskLabels` 是破坏性改动，RiskTaskStrip 与测试需同步 → Mitigation: 同步改 RiskTaskStrip 渲染逻辑，测试用例更新断言
- [Risk] 多标签着色若每个标签独立颜色，视觉可能杂乱 → Mitigation: 设计阶段默认统一中性底色，仅启动偏差用警示色、结束偏差用强警示色，具体在 build 阶段细化
- [Trade-off] 已完成任务的"超期X天"与进行中的"延期X天"措辞不同，需在 UI 上保持一致语义 → 已与用户对齐：进行中基于今天用"延期"，已完成基于实际结束日用"超期"
- [Risk] 未开始任务今天已过计划结束日时显示"已超期X天"，可能与进行中"延期X天"混淆 → Mitigation: 未开始任务前缀固定"未开始"，括号内明确"已超期"，语义清晰

## Migration Plan

纯前端改动，无数据迁移。改动集中在 `dashboardMetrics.ts`、`TaskDetailTable.tsx`、`RiskTaskStrip.tsx`、`styles.css` 及测试。部署即生效，回滚即还原文件。

## Open Questions

- 多标签视觉样式（每标签独立色块 vs 统一色系）留待 build 阶段根据实际效果细化，默认倾向统一色系 + 程度差异
