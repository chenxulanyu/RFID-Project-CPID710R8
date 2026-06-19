---
comet_change: project-dashboard-frontend
role: technical-design
canonical_spec: openspec
---

# Project Dashboard Frontend Technical Design

## Context

`web-app-foundation` 已提供 React + Vite + TypeScript 基础工程、项目进度领域模型、mock 数据源和 `getProjectProgress` 服务边界。本 change 在此基础上建设展示端：让用户打开网站后能先看到 CPID710R8 项目的整体健康度，再查看风险任务、任务明细和轻量时间轴。

本 change 不实现后台编辑、登录权限、CloudBase 写入、多项目切换或部署流程。所有展示数据仍通过现有服务契约读取。

## Confirmed Direction

采用“总览优先”布局：

1. 顶部展示项目名称、计划周期、当前日期和数据口径。
2. 第一屏展示 KPI：总体进度、任务总数、已完成、进行中、延期/临期、延迟启动。
3. 中部展示风险任务横条，突出延期、今日到期、7 日内到期和延迟启动任务。
4. 下部展示高密度任务明细表和轻量甘特/时间轴。
5. 手机竖屏显示横屏引导，不展示完整主内容；手机横屏和桌面展示完整看板。

## Architecture

在 `web/src/features/project/` 下扩展展示端组件，保持页面、派生逻辑和视觉组件分离：

```text
features/project/
├── FoundationPage.tsx              # 可替换为 dashboard 主入口或包装现有页面
├── dashboardMetrics.ts             # KPI、状态、风险任务、时间轴范围派生
├── DashboardPage.tsx               # 页面编排和数据加载
├── ProjectSummaryDashboard.tsx     # 顶部 KPI
├── RiskTaskStrip.tsx               # 风险任务横条
├── TaskDetailTable.tsx             # 高密度任务表
├── ProjectTimeline.tsx             # 轻量甘特/时间轴
└── LandscapeGate.tsx               # 竖屏横屏引导
```

若实现时发现文件过小，可以合并同类展示组件，但 `dashboardMetrics.ts` 必须保留为可测试的纯函数层。

## Data Model

不破坏 `web-app-foundation` 已归档契约，采用兼容式扩展：

```ts
type DashboardTaskStatus =
  | "finished"
  | "in-progress"
  | "start-delayed"
  | "not-started";
```

`dashboardStatus` 由任务日期和实际进度派生：

- `finished`：存在 `actualEndDate`。
- `in-progress`：未完成且存在 `actualStartDate`。
- `start-delayed`：未完成、无 `actualStartDate`，且 `plannedStartDate < today`。
- `not-started`：无 `actualStartDate`，且计划开始日未到。

保留 `elapsedDays` 的旧联合类型，避免扩大 foundation 契约变更。仪表盘内部使用 `dashboardStatus` 做分类和视觉状态。

## Metrics

`dashboardMetrics.ts` 输出：

- `totalTasks`
- `finishedTasks`
- `inProgressTasks`
- `notStartedTasks`
- `startDelayedTasks`
- `overdueTasks`
- `dueTodayTasks`
- `withinWeekTasks`
- `overallProgress`
- `riskTasks`
- `timelineRange`

`overallProgress` 首版可使用任务 `completionRatio` 的平均值，后续如需要按工期加权，可作为独立 change 调整。

## Visual Design

界面应是项目管理工作台，不做营销式 hero。风格安静、信息密度高、适合扫描：

- KPI 使用紧凑指标卡，最多 6 个。
- 风险状态用明确标签和颜色：延期、今日到期、7 日内到期、延迟启动、正常。
- 任务表优先展示编号、项目内容、任务名称、计划/实际日期、完成比例、状态、责任人、备注。
- 时间轴使用轻量条形排布，展示计划跨度、当前日期线和状态颜色，不引入复杂图表库。

用户明确要求文字和框体不要溢出。实现必须为指标卡、标签、表格单元格、时间轴条和横屏提示设置稳定尺寸、换行或截断策略。不得让文字互相遮挡，长任务名应使用换行或可读截断。

## Responsive Behavior

桌面端以 1180px 到 1440px 宽度优化，内容居中且保持扫描密度。

移动端策略：

- 窄屏竖向视口显示 `LandscapeGate`，提示用户横屏查看。
- 横屏视口展示完整 dashboard。
- 表格和时间轴可以在内容区域内横向滚动，但标题、KPI 和风险横条不应发生不可读溢出。

## Testing Strategy

- 单元测试：验证 `dashboardMetrics.ts` 对任务状态、延迟启动、延期/临期、整体进度的派生结果。
- 组件测试：验证 dashboard 能渲染项目标题、KPI、风险任务、任务表和时间轴。
- 移动行为测试：验证窄屏竖向出现横屏引导，横屏/桌面展示主内容。
- 视觉验证：使用浏览器在桌面和手机横屏视口检查无文字溢出、无重叠、时间轴和表格可读。

## Spec Patch

本设计回写 `project-dashboard-display` delta spec：

- 补充延迟启动任务场景。
- 补充桌面和移动横屏下文本、指标卡、表格和时间轴不得不可读溢出或重叠的场景。
