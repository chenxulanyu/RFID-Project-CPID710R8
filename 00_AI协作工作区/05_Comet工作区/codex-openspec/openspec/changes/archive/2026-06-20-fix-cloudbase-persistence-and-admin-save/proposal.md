## Why

线上 CloudBase 目前只保存了不完整的项目文档和旧格式任务，导致前端出现 `undefined` 周期、任务数量不对，以及后台“保存成功但其他设备看不到变化”的假成功问题。用户还希望项目基础信息和任务详情能通过一次保存一起提交，减少后台操作分裂。

## What Changes

- 修正 CloudBase 项目文档读取：当远端缺少计划周期字段时，回退到项目种子默认值，而不是把缺失值直接渲染成 `undefined`。
- 修正 CloudBase 写入确认：保存项目和任务后必须校验真实返回结果，并在回读不一致时明确报错。
- 调整后台保存交互：项目基础信息与当前任务详情使用同一个保存动作提交。
- 保持任务新增、更新、归档和恢复能力不变。

## Capabilities

### New Capabilities
- `cloudbase-write-confirmation`: CloudBase 写入必须可验证，且失败时不能误报成功。
- `admin-unified-save`: 后台页可通过单一动作同时保存项目基础信息和任务详情。

### Modified Capabilities
- `cloudbase-project-persistence`: 读取和写入规则需要覆盖缺失字段回退、写入校验和回读一致性。
- `admin-progress-management`: 后台保存交互从双按钮调整为单按钮统一保存。

## Impact

- 受影响代码：`web/src/services/cloudbaseProjectRepository.ts`、`web/src/features/project/AdminPage.tsx`、相关测试。
- 受影响数据流：CloudBase `projects` 和 `project_tasks` 集合。
- 受影响用户体验：前端周期显示、甘特图范围、后台保存反馈。
