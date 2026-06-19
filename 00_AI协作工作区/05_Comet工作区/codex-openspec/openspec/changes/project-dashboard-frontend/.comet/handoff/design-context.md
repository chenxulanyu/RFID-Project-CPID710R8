# Comet Design Handoff

- Change: project-dashboard-frontend
- Phase: design
- Mode: compact
- Context hash: e49a236e1f9a2705aadb24f02408366ada4e1278133b1c0691619b7621796678

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/project-dashboard-frontend/proposal.md

- Source: openspec/changes/project-dashboard-frontend/proposal.md
- Lines: 1-26
- SHA256: 33bc9f9712c7c1a0d0805b8482ab9098beb2c282013e14d6f4b77f9b7ee97854

```md
## Why

Excel 工作簿可以记录 CPID710R8 项目进度，但面向团队展示时不够直观，尤其在移动端和汇报场景中难以快速判断整体状态、临期风险和关键任务。需要一个前端展示端，把项目总览、任务详情、进度预警和时间轴以网站方式呈现。

## What Changes

- 实现项目展示首页或详情页，突出项目名称、周期、总工期、已开工天数、整体完成情况和关键预警。
- 增加仪表盘区域，展示任务总数、已完成/进行中/未开始、延期任务、临期任务和近期关键里程碑。
- 增加任务明细表，展示计划时间、实际时间、完成比例、超期天数、预警、资源方、责任人和备注。
- 增加时间轴或甘特图视图，用于直观呈现任务计划跨度和当前进度。
- 增加移动终端横屏展示策略，在竖屏打开时提示或引导横屏，以保证复杂表格和时间轴可读。
- 本 change 不实现后台编辑、不接入 CloudBase 写入、不处理账号登录和部署。

## Capabilities

### New Capabilities
- `project-dashboard-display`: 项目进度展示端，包括仪表盘、任务明细、预警呈现、时间轴/甘特图和移动端横屏适配。

### Modified Capabilities
- 无。

## Impact

- 依赖 `web-app-foundation` 提供的项目数据模型和数据访问抽象。
- 影响前端页面、展示组件、响应式布局和可视化组件。
- 后续 `admin-progress-backend` 和 `cloudbase-persistence` 提供真实数据后，该展示端应继续通过统一数据服务读取数据。
```

## openspec/changes/project-dashboard-frontend/design.md

- Source: openspec/changes/project-dashboard-frontend/design.md
- Lines: 1-45
- SHA256: e821cf4c0c3865531958e3c9f6b359a5a9b67b61370a086bd7afc4bca9e8f2e2

```md
## Context

CPID710R8 项目进度当前以 Excel 表格展示，信息密度高，包含任务分组、计划/实际日期、完成比例、预警和责任人。网站展示端需要把这些信息转为适合浏览器和移动终端查看的项目看板，并通过 `web-app-foundation` 的数据服务读取数据。

## Goals / Non-Goals

**Goals:**
- 提供项目总览仪表盘，让用户快速判断整体进度、延期和临期风险。
- 提供任务明细表，支持扫描关键字段和任务分组。
- 提供时间轴或甘特图视图，直观展示任务跨度和阶段排布。
- 在手机等窄屏设备上提供横屏提示或横屏优先布局，保证复杂信息可读。

**Non-Goals:**
- 不提供任务编辑、审批、登录或权限管理。
- 不直接访问 CloudBase，不处理云端写入。
- 不实现多项目切换，除非基础数据模型已经提供且不扩大本 change 范围。

## Decisions

1. **展示端采用“总览优先，明细下钻”的页面结构**
   - 选择：页面顶部展示项目关键指标，中部展示风险/里程碑，底部展示任务表和时间轴。
   - 理由：项目汇报场景需要先看到结论，再查看细节。
   - 替代方案：完全复制 Excel 表格。该方案保留信息但缺少仪表盘洞察。

2. **仪表盘指标由任务数据派生**
   - 选择：从任务状态、完成比例、日期和预警字段计算展示指标。
   - 理由：后端维护任务后，前端可以自动反映最新状态。
   - 替代方案：单独维护仪表盘统计。该方案容易与任务明细不一致。

3. **任务表保留高密度扫描能力**
   - 选择：桌面端展示主要字段，使用颜色、进度条、状态标签和预警标识增强扫描。
   - 理由：项目管理用户需要对比多条任务，而不是只看单卡片。
   - 替代方案：全部改成卡片。卡片在移动端友好，但桌面端对比效率低。

4. **移动端采用横屏优先策略**
   - 选择：竖屏时显示横屏提示或遮罩，引导用户旋转设备；横屏时呈现完整看板。
   - 理由：甘特图和任务表天然横向信息多，强行竖屏会牺牲可读性。
   - 替代方案：竖屏缩成单列卡片。该方案可作为后续增强，但不适合作为首版展示主路径。

## Risks / Trade-offs

- [Risk] 甘特图实现复杂或性能不佳 → Mitigation: 首版可使用轻量时间轴/条形排布，后续再增强交互。
- [Risk] 仪表盘指标与后端计算口径不一致 → Mitigation: 明确派生逻辑并基于领域模型编写可验证函数。
- [Risk] 横屏提示影响手机访问体验 → Mitigation: 仅在窄屏竖向且展示区域不可读时触发，保留清晰继续提示。
- [Risk] 数据字段过多导致桌面表格拥挤 → Mitigation: 优先展示核心字段，次要信息放入详情展开或备注区域。
```

## openspec/changes/project-dashboard-frontend/tasks.md

- Source: openspec/changes/project-dashboard-frontend/tasks.md
- Lines: 1-23
- SHA256: 19a1643a1c0b24297c4d4d998e67cc3439f04ec8c468c727113e9dc392d5dd27

```md
## 1. Dashboard Metrics

- [ ] 1.1 Implement derived dashboard metrics for task counts, overall progress, overdue tasks, and warning counts.
- [ ] 1.2 Build the project summary dashboard section with project period, duration, elapsed days, and progress indicators.
- [ ] 1.3 Verify dashboard metrics match the underlying task data.

## 2. Task Detail View

- [ ] 2.1 Build a high-density task detail table with schedule, progress, owner, warning, and remark fields.
- [ ] 2.2 Add visual status treatments for completion ratio, overdue days, due-today, due-within-week, and future warning states.
- [ ] 2.3 Support grouped milestone/task presentation matching the CPID710R8 schedule structure.

## 3. Timeline or Gantt View

- [ ] 3.1 Implement a timeline or Gantt-style visualization using planned task start and end dates.
- [ ] 3.2 Represent task progress or status in the timeline without requiring edit capability.
- [ ] 3.3 Verify overlapping and upcoming tasks are visually distinguishable.

## 4. Responsive and Mobile Behavior

- [ ] 4.1 Implement desktop layout constraints so dashboard, table, and timeline remain readable.
- [ ] 4.2 Implement mobile portrait landscape guidance or equivalent landscape-first behavior.
- [ ] 4.3 Verify the dashboard on desktop and mobile landscape viewport sizes.
```

## openspec/changes/project-dashboard-frontend/specs/project-dashboard-display/spec.md

- Source: openspec/changes/project-dashboard-frontend/specs/project-dashboard-display/spec.md
- Lines: 1-44
- SHA256: 3ca05492d5eed533c0b9ce23835d1a53b50a50f06c244a2375fed849c2a6ab7c

```md
## ADDED Requirements

### Requirement: Project summary dashboard
The system SHALL display a project summary dashboard with project name, project period, total duration, elapsed duration, overall progress, task status counts, overdue tasks, and upcoming warning counts.

#### Scenario: View project summary
- **WHEN** a user opens the project dashboard page
- **THEN** the user sees high-level project progress and risk indicators without editing data

#### Scenario: Identify delayed starts
- **WHEN** a task's planned start date is before today and the task has no actual start date
- **THEN** the dashboard counts and labels the task as start-delayed rather than merely not-started

### Requirement: Task detail table
The system SHALL display project tasks in a readable detail table including task grouping, task name, planned dates, actual dates, duration, completion ratio, overdue days, warning state, resource owner, responsible person, and remarks when available.

#### Scenario: Inspect task details
- **WHEN** a user reviews the task detail section
- **THEN** the user can identify each task's schedule, progress, owner, and risk information

### Requirement: Timeline or Gantt visualization
The system SHALL provide a timeline or Gantt-style visualization that represents planned task spans and indicates progress or status using the project task data.

#### Scenario: Compare task schedule spans
- **WHEN** a user views the timeline or Gantt section
- **THEN** the user can compare task timing and understand which work items overlap or are upcoming

### Requirement: Warning presentation
The system SHALL visually distinguish overdue, due-today, due-within-week, and future warning states in the dashboard and task detail views.

#### Scenario: Identify risky tasks
- **WHEN** one or more tasks are overdue or near their planned finish date
- **THEN** the dashboard and task list highlight those tasks with clear warning indicators

### Requirement: Mobile landscape guidance
The system SHALL guide mobile users toward landscape viewing when the viewport is too narrow for the project table or timeline to remain readable.

#### Scenario: Open dashboard on portrait phone
- **WHEN** a user opens the dashboard on a narrow portrait mobile viewport
- **THEN** the system displays a landscape guidance state or equivalent layout behavior that protects table and timeline readability

#### Scenario: Preserve readable layout
- **WHEN** the dashboard is viewed on desktop or mobile landscape viewport sizes
- **THEN** dashboard text, metric cards, task table cells, timeline bars, and guidance copy fit within their containers without unreadable overflow or incoherent overlap
```

