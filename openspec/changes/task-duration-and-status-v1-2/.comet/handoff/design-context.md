# Comet Design Handoff

- Change: task-duration-and-status-v1-2
- Phase: design
- Mode: compact
- Context hash: 4dceb734ccf19af0c3124e86d622f2350c144225ccd1c5da9b1dd1cbce0a929e

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/task-duration-and-status-v1-2/proposal.md

- Source: openspec/changes/task-duration-and-status-v1-2/proposal.md
- Lines: 1-34
- SHA256: b06ce1655f475de57fb8118a6fca826c23d76b75af61d145fceea44e879483e1

```md
## Why

V1.1 仪表盘已落地，但任务明细表仍无法直观看到每项任务的工期天数，且状态列只能呈现单一风险标签，无法同时表达"启动偏差"与"结束偏差"。项目里大量任务存在延迟启动又超期完成的情况，单一标签会丢失信息，项目管理者难以快速判断每项任务的实际执行偏差。本次在 V1.2 补齐工期列并重构状态显示为多标签组合。

## What Changes

- 任务明细表在"计划周期"列右侧新增"计划工期"列，显示 `X天`（自然日，计划结束-计划开始+1）
- 任务明细表在"实际周期"列右侧新增"实际工期"列：有实际开始+结束显示 `X天`；仅有实际开始显示 `进行中`；无实际开始显示 `-`
- 状态列从单标签改为多标签组合，可同时展示启动偏差与结束偏差：
  - 启动状态：实际开始晚于计划开始 → 延迟启动；早于 → 提前启动；相等不显示
  - 未开始任务：括号显示距计划结束天数 `（距X天）`，已过计划结束日显示 `（已超期X天）`
  - 进行中任务：保留基于今天的实时预警（今日到期 / 7日内到期 / 延期X天）
  - 已完成任务：实际结束晚于计划结束 → 超期X天；早于 → 提前X天；相等不显示；无任何偏差时显示"已完成"
- 多标签组合用顿号分隔，示例：`延迟启动、超期17天` / `提前启动、提前2天` / `未开始（已超期52天）`
- 措辞区分：进行中实时超时用"延期X天"（基于今天），已完成回看超时用"超期X天"（基于实际结束日）

## Capabilities

### New Capabilities

- `task-duration-status`: 任务明细表的工期展示与多标签状态组合规则

### Modified Capabilities

无（V1.1 归档后 openspec/specs/ 为空，本次为新增 capability）

## Impact

- 前端组件：`TaskDetailTable.tsx`（新增两列、状态单元格改为渲染多标签）、`RiskTaskStrip.tsx`（复用多标签逻辑，同步适配）、`DashboardPage.tsx`（透传天数）
- 数据派生：`dashboardMetrics.ts`（`riskLabel: string` → `riskLabels: string[]`，状态标签计算重构）、`projectService.ts`（工期天数已就绪，无需改计算）
- 类型定义：`types/project.ts` / `dashboardMetrics.ts`（`DashboardTask` 扩展字段）
- 样式：`styles.css`（新列样式、多标签着色与间距）
- 测试：`TaskDetailTable.test.tsx`、`dashboardMetrics.test.ts`（新增列与多标签断言）
- 不影响：数据输入/后台表单、CloudBase 存储、完成比例计算、时间轴渲染
```

## openspec/changes/task-duration-and-status-v1-2/design.md

- Source: openspec/changes/task-duration-and-status-v1-2/design.md
- Lines: 1-68
- SHA256: 172d2b0d3817435938cfb333324a644ff2638a1d0cd805f510bfa7701b5b1c5c

```md
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
```

## openspec/changes/task-duration-and-status-v1-2/tasks.md

- Source: openspec/changes/task-duration-and-status-v1-2/tasks.md
- Lines: 1-39
- SHA256: 090f6f8515b76e5e1fc8696965427ea8b3afd115d8c7e0e88f2e9e346690ff82

```md
## 1. 类型定义与数据派生

- [ ] 1.1 `dashboardMetrics.ts`：`DashboardTask` 字段 `riskLabel: string` 改为 `riskLabels: string[]`
- [ ] 1.2 `dashboardMetrics.ts`：新增 `getStartDeviationLabel(task)` —— 延迟启动/提前启动/undefined
- [ ] 1.3 `dashboardMetrics.ts`：新增 `getCompletionDeviationLabel(task)` —— 已完成任务的 超期X天/提前X天/undefined
- [ ] 1.4 `dashboardMetrics.ts`：新增 `getNotStartedCountdownLabel(task, today)` —— 距X天/已超期X天
- [ ] 1.5 `dashboardMetrics.ts`：重构 `getRiskLabel` 为 `getRiskLabels(task, today)`，按未开始/进行中/已完成分支组装有序标签数组
- [ ] 1.6 `dashboardMetrics.ts`：`buildDashboardModel` 中用 `riskLabels` 替换 `riskLabel`，`isRiskTask` 改为判断 `riskLabels.length > 0`

## 2. 表格组件工期列

- [ ] 2.1 `TaskDetailTable.tsx`：表头在"计划周期"后插入"计划工期"列，在"实际周期"后插入"实际工期"列
- [ ] 2.2 `TaskDetailTable.tsx`：计划工期单元格渲染 `task.plannedDurationDays` 天
- [ ] 2.3 `TaskDetailTable.tsx`：实际工期单元格按完备程度渲染 天数/进行中/-

## 3. 状态列多标签渲染

- [ ] 3.1 `TaskDetailTable.tsx`：状态单元格改为渲染 `task.riskLabels`，用顿号分隔；数组为空时回退 `task.statusLabel`
- [ ] 3.2 `TaskDetailTable.tsx`：未开始任务的倒计时括号随标签数组渲染（`未开始（距X天）`）
- [ ] 3.3 `RiskTaskStrip.tsx`：同步适配 `riskLabels` 数组渲染与 `warningClass` 判定

## 4. 样式

- [ ] 4.1 `styles.css`：新增计划工期/实际工期列样式（右对齐、窄列）
- [ ] 4.2 `styles.css`：多标签状态样式（标签间距、着色按偏差程度区分）

## 5. 测试

- [ ] 5.1 `dashboardMetrics.test.ts`：新增启动偏差、已完成结束偏差、未开始倒计时标签的单测
- [ ] 5.2 `dashboardMetrics.test.ts`：多标签组合与顺序断言（延迟启动+超期、提前启动+提前、无偏差回退）
- [ ] 5.3 `TaskDetailTable.test.tsx`：新增计划工期/实际工期列渲染断言
- [ ] 5.4 `TaskDetailTable.test.tsx`：状态列多标签与回退渲染断言
- [ ] 5.5 `RiskTaskStrip` 相关测试同步适配（如有）

## 6. 回归验证

- [ ] 6.1 全量测试通过（`npx vitest run`）
- [ ] 6.2 `npm run build` 通过
- [ ] 6.3 Claude Code 审查
```

## openspec/changes/task-duration-and-status-v1-2/specs/task-duration-status/spec.md

- Source: openspec/changes/task-duration-and-status-v1-2/specs/task-duration-status/spec.md
- Lines: 1-101
- SHA256: 4989d7536ad12c00d3e3a586d9edc5eae9e2d32ab6607701ae72d94179313cf0

[TRUNCATED]

```md
## ADDED Requirements

### Requirement: 计划工期列展示
任务明细表在"计划周期"列右侧 SHALL 新增"计划工期"列，显示该任务计划开始到计划结束的自然日天数（计划结束 - 计划开始 + 1），格式为 `X天`。

#### Scenario: 正常计划工期
- **WHEN** 任务计划开始为 2026-03-30、计划结束为 2026-04-19
- **THEN** "计划工期"列显示 `21天`

#### Scenario: 同日开始结束
- **WHEN** 任务计划开始与计划结束为同一天（如 2026-04-28 至 2026-04-28）
- **THEN** "计划工期"列显示 `1天`

### Requirement: 实际工期列展示
任务明细表在"实际周期"列右侧 SHALL 新增"实际工期"列，按实际日期完备程度显示：有实际开始和实际结束显示自然日天数 `X天`；仅有实际开始显示 `进行中`；无实际开始显示 `-`。

#### Scenario: 实际工期完整
- **WHEN** 任务实际开始为 2026-04-06、实际结束为 2026-04-30
- **THEN** "实际工期"列显示 `25天`

#### Scenario: 仅有实际开始
- **WHEN** 任务有实际开始日期但无实际结束日期
- **THEN** "实际工期"列显示 `进行中`

#### Scenario: 未开始任务
- **WHEN** 任务无实际开始日期
- **THEN** "实际工期"列显示 `-`

### Requirement: 状态列多标签组合
状态列 SHALL 以多标签组合呈现，可同时显示启动偏差与结束偏差，标签间用顿号分隔。当无任何偏差标签时，显示任务基础状态（已完成/进行中/未开始）。

#### Scenario: 多标签组合
- **WHEN** 已完成任务实际开始晚于计划开始、实际结束晚于计划结束
- **THEN** 状态列显示 `延迟启动、超期17天`

#### Scenario: 无偏差时回退基础状态
- **WHEN** 已完成任务实际开始等于计划开始、实际结束等于计划结束
- **THEN** 状态列显示 `已完成`

### Requirement: 启动偏差标签
对所有已开始任务（进行中与已完成），系统 SHALL 根据实际开始与计划开始的对比生成启动偏差标签：实际开始晚于计划开始 → `延迟启动`；早于 → `提前启动`；相等则不生成启动标签。无实际开始的任务不生成启动标签。

#### Scenario: 延迟启动
- **WHEN** 任务计划开始 2026-03-30、实际开始 2026-04-06
- **THEN** 生成启动标签 `延迟启动`

#### Scenario: 提前启动
- **WHEN** 任务计划开始 2026-04-06、实际开始 2026-03-30
- **THEN** 生成启动标签 `提前启动`

#### Scenario: 启动相等无标签
- **WHEN** 任务计划开始与实际开始为同一天
- **THEN** 不生成启动标签

### Requirement: 已完成任务结束偏差标签
已完成任务（有实际结束日期）SHALL 根据实际结束与计划结束的对比生成结束偏差标签：实际结束晚于计划结束 → `超期X天`（X = 计划结束到实际结束的自然日天数 - 1）；早于 → `提前X天`（X = 实际结束到计划结束的自然日天数 - 1）；相等则不生成。措辞用"超期/提前"以区别于进行中任务的"延期"。

#### Scenario: 已完成超期
- **WHEN** 任务计划结束 2026-04-13、实际结束 2026-04-30
- **THEN** 生成结束标签 `超期17天`

#### Scenario: 已完成提前
- **WHEN** 任务计划结束 2026-04-27、实际结束 2026-04-25
- **THEN** 生成结束标签 `提前2天`

#### Scenario: 已完成按时不生成标签
- **WHEN** 任务计划结束与实际结束为同一天
- **THEN** 不生成结束标签

### Requirement: 进行中任务实时预警标签
进行中任务（有实际开始、无实际结束）SHALL 沿用基于今天的实时预警标签：`warningState` 为 overdue → `延期X天`（X = `overdueDays`）；due-today → `今日到期`；within-week → `7日内到期`。该标签与启动偏差标签可同时显示，措辞用"延期"以区别于已完成的"超期"。

#### Scenario: 进行中延期且延迟启动
- **WHEN** 进行中任务延迟启动且今天已过计划结束日
- **THEN** 状态列显示 `延迟启动、延期X天`

#### Scenario: 进行中临期
- **WHEN** 进行中任务今天距计划结束在 7 日内
- **THEN** 状态列显示 `7日内到期`（或附加启动标签）

```

Full source: openspec/changes/task-duration-and-status-v1-2/specs/task-duration-status/spec.md

