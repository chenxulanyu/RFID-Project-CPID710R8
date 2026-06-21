# Comet Design Handoff

- Change: dashboard-cloudbase-ui-polish
- Phase: design
- Mode: compact
- Context hash: b6b71ab0f29dcb294b560b555474735986dbb89c172be3f8e1738d5c1a9389c0

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/dashboard-cloudbase-ui-polish/proposal.md

- Source: openspec/changes/dashboard-cloudbase-ui-polish/proposal.md
- Lines: 1-30
- SHA256: bfc0cd77c89bc59dd9add1b6d15a2f84f5f81fcb68964b7446cf2e3316df789d

```md
## Why

v1.1 后台维护允许资源方和责任人为空，但前台读取层仍按旧规则把这两个字段视为必填，导致新增任务虽然保存到 CloudBase，项目仪表盘刷新后仍可能回退到默认种子数据。与此同时，新增的未启动指标让仪表盘换行，时间轴双条形缺少图示且仍显示百分比，后台项目信息面板出现异常拉伸，影响部署后的日常维护和展示。

## What Changes

- 修复前台项目数据读取规则，使资源方和责任人为空的有效 CloudBase 任务仍可进入项目仪表盘、风险任务、任务详情和时间轴。
- 调整仪表盘 KPI 卡片为单行自适应宽度布局，并把延期/临期、延迟启动放到任务总数后面。
- 为计划时间轴增加蓝色计划周期、红色实际周期图示，并移除条形内部百分比文本。
- 修复后台维护项目信息面板高度异常拉伸，使任务详情紧跟项目信息区域。
- 保持 CloudBase 配置、扣子部署配置、Git 远程配置不变。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `project-dashboard-display`: 更新仪表盘 KPI 布局、时间轴双条形图示和百分比显示规则。
- `admin-progress-management`: 更新后台维护表单布局要求，避免项目信息面板异常占用垂直空间。
- `cloudbase-project-persistence`: 更新前台读取 CloudBase 任务时的有效性规则，资源方和责任人为空不应触发默认数据回退。

## Impact

- 影响前台展示组件：`ProjectSummaryDashboard.tsx`、`ProjectTimeline.tsx`、相关样式和测试。
- 影响数据读取服务：`projectService.ts` 及其测试。
- 影响后台维护布局样式：`styles.css`，必要时补充 Admin 页面布局测试。
- 不引入新依赖，不修改 CloudBase 环境、集合名、访问密钥或扣子部署配置。
```

## openspec/changes/dashboard-cloudbase-ui-polish/design.md

- Source: openspec/changes/dashboard-cloudbase-ui-polish/design.md
- Lines: 1-49
- SHA256: dda5e2ec130e70a52f37a301d8716db2293f39902d6851981455922e39379b84

```md
## Context

当前部署版本在后台保存任务后，CloudBase 写入可以成功，但前台刷新后可能仍显示默认任务。根因是 `projectService` 的 `selectTaskInputs` 仍使用旧的 `hasRequiredTaskFields`，要求 `resourceOwner` 和 `responsiblePerson` 非空；v1.1 已经在后台校验和 CloudBase 文档校验中取消这两个字段必填，两处规则不一致。

前台 UI 还存在三个展示问题：新增的未启动 KPI 让 `metric-grid` 从 6 列变为 7 张卡片后换行；时间轴双条形没有图示且仍在条内显示百分比；后台 `.admin-panels` 使用 grid 拉伸，使项目信息面板在左侧任务列表很长时被拉高，任务详情被推到很远。

## Goals / Non-Goals

**Goals:**

- 让资源方、责任人为空的有效任务在前台读取时保持有效，新增任务保存后跨设备刷新可见。
- 让仪表盘 KPI 在桌面宽屏保持一行，并按内容宽度自适应。
- 让时间轴明确说明蓝色代表计划周期、红色代表实际周期，并取消条内百分比。
- 让后台项目信息区域按内容自然高度显示，任务详情紧跟其后。

**Non-Goals:**

- 不修改 CloudBase 环境配置、集合权限、安全域名、扣子 `.coze` 和根 `package.json` 部署配置。
- 不重新设计项目数据模型，不新增数据库集合。
- 不改变后台“资源方/责任人可为空”的需求。
- 不处理本 change 范围外的归档、删除、项目周期自动扩展逻辑。

## Decisions

1. 前台读取校验与后台保存校验对齐。
   - 将 `projectService` 的任务必填字段从旧的八项缩减为任务身份、里程碑、项目内容、任务名称、计划开始、计划结束。
   - 资源方和责任人为空时继续保留任务；字段展示层按现有空字符串处理。
   - 保留“明显无效任务集合回退默认种子”的保护，只是不再把可选字段为空视为无效。

2. KPI 布局采用横向自适应网格。
   - 桌面使用 `grid-template-columns: repeat(7, max-content)` 或等价的内容宽度布局，避免空白被 `1fr` 放大。
   - 卡片设置合理最小宽度和内容宽度上限，保护中文标签和数字不溢出。
   - 顺序调整为：总体进度、任务总数、延期/临期、延迟启动、已完成、进行中、未启动。

3. 时间轴双条形改为“图示 + 无百分比条形”。
   - `ProjectTimeline` 标题区域增加 legend：计划周期蓝色、实际周期红色。
   - 保留计划蓝条和实际红条的不同高度居中重叠设计。
   - 移除 `.timeline-percent` 渲染和相关测试期望，避免窄条文字截断。

4. 后台布局取消右侧面板拉伸。
   - `.admin-panels` 不再把每个 section 拉伸到左侧任务列表高度；改为内容高度排列。
   - 保持左侧任务列表仍可使用可用高度和内部滚动，避免回退此前已修复的任务列表问题。

## Risks / Trade-offs

- [Risk] 放宽前台有效性校验可能让少量缺少负责人字段的历史数据进入展示。→ Mitigation: 只放宽资源方和责任人，其他身份和计划字段仍然必填。
- [Risk] 七张 KPI 卡片在窄屏无法一行显示。→ Mitigation: 桌面优先一行；窄屏沿用响应式横向/多列保护，不强行压缩到不可读。
- [Risk] 去掉时间轴百分比后少一个进度线索。→ Mitigation: 进度仍保留在任务详情和总体指标中，时间轴专注计划/实际周期对比。
- [Risk] 后台布局调整影响左侧任务列表高度。→ Mitigation: 只改右侧 `.admin-panels` 的 section 排列，不改 `.admin-layout > .admin-panel` 的伸展规则。
```

## openspec/changes/dashboard-cloudbase-ui-polish/tasks.md

- Source: openspec/changes/dashboard-cloudbase-ui-polish/tasks.md
- Lines: 1-34
- SHA256: 50e836c6de10b4c07f1ae624d395dbd3707c24b34722a3b52887d7c9fe4c0353

```md
# Tasks: dashboard-cloudbase-ui-polish

## 1. 修复前台 CloudBase 任务读取回退
- [ ] 1.1 在 `web/src/services/projectService.test.ts` 增加失败用例：仓库返回一条资源方/责任人为空但其他必填字段完整的新任务时，`getProjectProgress` 返回该任务且不回退到默认 31 条种子任务
- [ ] 1.2 运行聚焦测试，确认测试先失败
- [ ] 1.3 修改 `web/src/services/projectService.ts` 的前台任务有效性校验，与后台非必填规则对齐
- [ ] 1.4 运行聚焦测试，确认测试通过

## 2. 调整仪表盘 KPI 单行自适应布局
- [ ] 2.1 在 `ProjectSummaryDashboard` 或相关测试中增加顺序断言：任务总数之后依次出现延期/临期、延迟启动
- [ ] 2.2 增加样式回归测试或文本断言，覆盖 `metric-grid` 桌面单行自适应规则
- [ ] 2.3 调整 `ProjectSummaryDashboard.tsx` KPI 顺序
- [ ] 2.4 调整 `web/src/styles.css` 中 `.metric-grid` / `.metric-card` 桌面布局，减少无效空白并保护文本不溢出
- [ ] 2.5 运行相关测试

## 3. 调整计划时间轴图示和百分比显示
- [ ] 3.1 在 `ProjectTimeline.test.tsx` 增加失败用例：显示“计划周期”“实际周期”图示
- [ ] 3.2 修改既有时间轴测试：条形内部不再显示 `95%` 或 `100%`
- [ ] 3.3 运行聚焦测试，确认新旧期望先失败
- [ ] 3.4 修改 `ProjectTimeline.tsx`，新增 legend，移除 `.timeline-percent` 渲染
- [ ] 3.5 清理 `styles.css` 中不再使用的 `.timeline-percent` 样式，并完善 legend 样式
- [ ] 3.6 运行聚焦测试，确认通过

## 4. 修复后台项目信息面板异常拉伸
- [ ] 4.1 增加样式回归测试，覆盖 `.admin-panels` 不拉伸每个 section 到左侧任务列表高度
- [ ] 4.2 修改 `styles.css` 后台右侧面板布局，使项目信息 section 按内容高度排列
- [ ] 4.3 确认左侧任务列表仍保持可用高度和内部滚动能力
- [ ] 4.4 运行相关测试

## 5. 全量验证和审查准备
- [ ] 5.1 运行 `npm test --workspace web`
- [ ] 5.2 运行 `npm run build --workspace web`
- [ ] 5.3 生成可直接发给 Claude Code 的审查指令，要求重点审查 CloudBase 前台回退根因、KPI 布局、时间轴 legend/百分比移除、后台面板高度
- [ ] 5.4 等待 Claude Code 审查通过后，再进入归档和推送
```

## openspec/changes/dashboard-cloudbase-ui-polish/specs/admin-progress-management/spec.md

- Source: openspec/changes/dashboard-cloudbase-ui-polish/specs/admin-progress-management/spec.md
- Lines: 1-33
- SHA256: 8a837843bc239310576f8a05c99172ee179c71a6b2d1e04cb70f1b6a3f402b5b

```md
## MODIFIED Requirements

### Requirement: Maintain project metadata
The system SHALL provide an administrative capability to view and update project metadata including project name, project period, and descriptive information required by the display frontend.

#### Scenario: Update project period
- **WHEN** an administrator updates the project start or end date with valid dates
- **THEN** the saved project metadata is available to the frontend data service

#### Scenario: Lock project metadata by default
- **WHEN** an administrator opens the maintenance page
- **THEN** project metadata fields are read-only or disabled until the administrator explicitly confirms editing them

#### Scenario: Keep project section compact
- **WHEN** an administrator opens the maintenance page with a long task list on the left
- **THEN** the project metadata section uses its natural content height
- **AND** the task detail section appears directly below the project metadata section without a large blank vertical gap

### Requirement: Maintain task progress data
The system SHALL provide an administrative capability to create or update task data including milestone grouping, task name, planned dates, actual dates, progress input, optional resource owner, optional responsible person, and remarks.

#### Scenario: Update task actual progress
- **WHEN** an administrator updates a task's actual start date, actual end date, or progress-related input
- **THEN** subsequent project data reads reflect the updated task information

#### Scenario: Create task
- **WHEN** an administrator creates a task with valid required fields
- **THEN** subsequent project data reads include the new active task

#### Scenario: Create task without optional owner fields
- **WHEN** an administrator creates a task with resource owner and responsible person left blank
- **THEN** the task save succeeds if all required task identity and schedule fields are valid
- **AND** subsequent project data reads include the new active task
```

## openspec/changes/dashboard-cloudbase-ui-polish/specs/cloudbase-project-persistence/spec.md

- Source: openspec/changes/dashboard-cloudbase-ui-polish/specs/cloudbase-project-persistence/spec.md
- Lines: 1-25
- SHA256: 87a580ddab371ef4cf9a83a635ccbc4ba1532b2d82fddd5d391223b27e308b2e

```md
## MODIFIED Requirements

### Requirement: CloudBase repository adapter
The system SHALL provide a CloudBase-backed repository adapter that supports reading project data and writing administrative updates through the existing service contract, and SHALL treat malformed or incomplete remote documents as invalid so the UI can fall back to seeded defaults rather than rendering undefined values.

#### Scenario: Read project data from CloudBase
- **WHEN** CloudBase configuration is present and the frontend or backend requests project data
- **THEN** the system reads project metadata and task records from CloudBase through the repository adapter
- **AND** missing required project fields are recovered from the seeded default project values

#### Scenario: Read task without optional owner fields
- **WHEN** a CloudBase task record has valid identity, project content, task name, planned start date, and planned end date
- **AND** the task record has empty resource owner or responsible person fields
- **THEN** the frontend project data service treats the task as valid
- **AND** the frontend project data service MUST NOT fall back to seeded default tasks solely because those optional fields are empty

#### Scenario: Reject malformed write results
- **WHEN** CloudBase returns an error code or the saved document cannot be read back consistently
- **THEN** the system MUST report the save as failed
- **AND** the system MUST NOT treat the write as successful

#### Scenario: Confirm project save after write
- **WHEN** the system saves project metadata and the first readback differs only by recoverable CloudBase serialization or timing differences
- **THEN** the system MAY retry the readback once and compare normalized project fields before declaring failure
- **AND** the system MUST still fail the save if the normalized values do not match the submitted metadata
```

## openspec/changes/dashboard-cloudbase-ui-polish/specs/project-dashboard-display/spec.md

- Source: openspec/changes/dashboard-cloudbase-ui-polish/specs/project-dashboard-display/spec.md
- Lines: 1-37
- SHA256: 68fe846fb73a37fb712ccc53d8f2dd81d7003410ef3329954b70c90568f8e6be

```md
## MODIFIED Requirements

### Requirement: Project summary dashboard
The system SHALL display a project summary dashboard with project name, project period, total duration, elapsed duration, overall progress, task status counts, overdue tasks, and upcoming warning counts.

#### Scenario: View project summary
- **WHEN** a user opens the project dashboard page on a desktop-width viewport
- **THEN** the user sees high-level project progress and risk indicators without editing data
- **AND** the KPI cards are arranged in a single row when the viewport has enough horizontal space
- **AND** the KPI card widths adapt to their content instead of expanding into large empty columns

#### Scenario: Order summary indicators
- **WHEN** the user scans the project summary KPI row
- **THEN** the delayed or near-due indicator and delayed-start indicator appear immediately after the total task indicator
- **AND** completed, in-progress, and not-started indicators appear after those risk indicators

#### Scenario: Identify delayed starts
- **WHEN** a task's planned start date is before today and the task has no actual start date
- **THEN** the dashboard counts and labels the task as start-delayed rather than merely not-started

### Requirement: Timeline or Gantt visualization
The system SHALL provide a timeline or Gantt-style visualization that represents planned task spans and actual task spans using the project task data.

#### Scenario: Compare task schedule spans
- **WHEN** a user views the timeline or Gantt section
- **THEN** the user can compare task timing and understand which work items overlap or are upcoming

#### Scenario: Distinguish planned and actual spans
- **WHEN** the timeline displays both planned and actual dates for a task
- **THEN** the planned span is represented by a blue bar
- **AND** the actual span is represented by a red bar with a different height from the planned bar
- **AND** the timeline includes a legend explaining the blue and red bars

#### Scenario: Omit bar percentage text
- **WHEN** the user views a task bar in the timeline or Gantt section
- **THEN** the bar does not display the completion percentage text inside the bar
- **AND** the bar remains readable without truncated percentage labels
```

