## Why

后台维护页在 CloudBase 保存项目信息时仍会误判回读不一致，影响项目元数据修改；同时，后台任务列表、保存按钮和前台甘特图的标签排布还不够顺手，存在可用空间浪费、按钮位置不协调和时间标签遮挡的问题，需要一起修正。

## What Changes

- 修复 CloudBase 项目信息保存后的回读校验误报，避免修改项目日期时无故提示保存失败。
- 调整后台维护页左侧任务列表高度，使其随页面可用空间拉伸，减少不必要的短列表滚动。
- 将“保存任务信息”按钮移动到归档/恢复任务操作旁边，保持任务操作集中在同一区域。
- 调整前端任务主文案的强调顺序，使项目内容加粗、任务名称恢复常规字重。
- 优化甘特图条形内的时间标签与百分比显示，避免 100% 被截断，并让开始/结束时间分别贴靠条内两端对齐。

## Capabilities

### Modified Capabilities
- `admin-progress-management`: 后台维护页的项目信息保存、任务列表布局与任务操作区交互需要更新。
- `project-dashboard-display`: 前台任务表格与甘特图的展示布局、字重和时间标签排版需要更新。
- `cloudbase-project-persistence`: 项目信息保存后的回读确认需要更稳健，以减少 CloudBase 回读差异导致的误报。

## Impact

- 受影响代码：`web/src/services/cloudbaseProjectRepository.ts`、`web/src/features/project/AdminPage.tsx`、`web/src/features/project/ProjectTimeline.tsx`、`web/src/features/project/ProjectSummaryDashboard.tsx`、`web/src/features/project/TaskDetailTable.tsx`、`web/src/styles.css` 及相关测试。
- 受影响文档：版本记录、变更记录和审查记录。
- 受影响用户体验：项目日期编辑成功率、后台维护滚动体验、任务保存入口位置、前台任务阅读顺序和甘特图可读性。
