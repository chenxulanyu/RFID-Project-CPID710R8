---
comet_change: fix-dashboard-status-and-admin-list
role: technical-design
canonical_spec: openspec
---

# fix-dashboard-status-and-admin-list Technical Design

## 背景

本次 change 修复三个用户已确认的问题：后台维护左侧任务列表高度短于右侧内容区、仪表盘生命周期统计无法与任务明细总数闭合、风险任务中延迟启动卡片可能显示为白色。

这些问题都属于展示语义或布局问题，不涉及 CloudBase 持久化、数据 schema、部署配置、seed 数据或仓库远端。

## 目标

- `已完成 + 正在进行 + 未启动` 必须等于任务明细总数。
- 延迟启动作为独立风险/KPI 统计，不再替代生命周期状态。
- 延迟启动风险卡片必须有稳定的可见颜色样式。
- 后台维护左侧任务列表面板高度与右侧“项目信息 + 任务详情”组合区域对齐，长列表在内部滚动。

## 非目标

- 不修改 CloudBase 读写流程。
- 不修改任务保存、新增、归档、删除逻辑。
- 不修改部署配置、`.coze`、根 `package.json` 或远端仓库设置。
- 不重新设计整体页面，只修复当前回归。

## 设计

### 1. 生命周期状态与风险维度分离

`dashboardMetrics.ts` 中的生命周期状态只由实际日期推导：

- 存在 `actualEndDate`：`finished`
- 存在 `actualStartDate` 且不存在 `actualEndDate`：`in-progress`
- 不存在 `actualStartDate`：`not-started`

延迟启动独立计算：

- 存在 `plannedStartDate` 与 `actualStartDate`
- `actualStartDate > plannedStartDate`

延迟启动任务仍然计入它本来的生命周期状态。例如，实际开始晚于计划开始且没有实际结束日期的任务计入“正在进行”，同时计入“延迟启动”风险；已完成但启动晚的任务计入“已完成”，同时计入“延迟启动”风险。

### 2. 风险样式独立化

风险任务展示不再依赖 `status-start-delayed` 这种生命周期类名表达延迟启动颜色。展示层应为延迟启动生成独立 warning class，例如 `warning-start-delayed`。

这样当任务没有临期或延期状态但满足延迟启动时，风险卡片仍能显示为警示色，而不是退化为白色普通卡片。

### 3. 后台维护布局对齐

后台维护页左侧任务列表面板不再使用旧的 viewport-only 高度截断规则，例如 `max-height: calc(100vh - 220px)`。

布局应让 admin grid 的左右列自然拉伸，使左侧 panel 高度跟随右侧“项目信息 + 任务详情”组合高度。任务很多时，滚动发生在 `.admin-task-list` 内部，而不是让整个左侧 panel 高度无限增长或被截短。

## 测试计划

- `dashboardMetrics.test.ts` 增加生命周期分区测试，断言三类生命周期计数相加等于 `totalDetailTasks`。
- `dashboardMetrics.test.ts` 增加延迟启动但进行中的任务仍计入 `in-progress` 的测试。
- `dashboardMetrics.test.ts` 增加延迟启动但已完成的任务仍计入 `finished` 的测试。
- 风险展示测试或 CSS 断言覆盖 `warning-start-delayed`，确保延迟启动风险有可见 warning 样式。
- `styles.test.ts` 断言旧的左侧 admin panel `max-height: calc(100vh - 220px)` 不存在。
- `styles.test.ts` 断言 `.admin-task-list` 保留内部滚动能力。
- 完成后运行：
  - `npm test --workspace web`
  - `npm run build --workspace web`
  - `openspec validate fix-dashboard-status-and-admin-list --strict`
  - `openspec validate --specs --strict`

## 双 AI 审查要求

实现完成后，必须先生成 Claude Code 审查指令，由 Claude Code 复审通过后，才能进入归档和推送。审查重点包括：

- 生命周期状态是否不再包含延迟启动。
- 仪表盘三类生命周期计数是否与任务明细总数闭合。
- 延迟启动风险是否具备独立可见样式。
- 后台任务列表高度是否由布局拉伸对齐，列表内部滚动是否保留。
- 是否未修改 CloudBase、部署、seed 或无关资料文件。
