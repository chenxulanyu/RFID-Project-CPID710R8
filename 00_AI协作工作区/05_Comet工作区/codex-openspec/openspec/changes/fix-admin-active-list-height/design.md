## Context

当前 CSS 让 `.admin-layout` 左右列同处一个 grid 行，并设置 `align-items: stretch`。左侧 `.admin-panel` 内的 `.admin-task-list` 有 `overflow: auto`，但没有可计算的高度约束；当活跃任务条目较多时，列表内容高度仍参与 grid 行高计算，导致左侧 panel 和整行高度被撑高。已归档任务较少时不会触发这个问题，所以视觉上看起来正确。

## Approach

用右侧 `.admin-panels` 的实际渲染高度作为左侧任务列表 panel 的高度基准。后台页渲染后测量右侧“项目信息 + 任务详情”组合区域高度，并将该高度作为左侧 `<aside>` 的 inline height/maxHeight。左侧 panel 继续使用 flex column，`.admin-task-list` 使用 `flex: 1; min-height: 0; overflow: auto`，从而让任务行在列表内部滚动。

该修复比单纯 CSS `max-height` 更贴近需求：高度基准来自右侧实际内容，而不是视口估算值，也不会因为活跃任务数量变化而改变左侧外框高度。

## Non-Goals

- 不修改任务保存、归档、恢复、删除逻辑。
- 不修改 CloudBase 读写或部署配置。
- 不改变右侧表单结构和字段布局。

## Risks

- DOM 测量需要在窗口尺寸变化和右侧内容变化时更新。实现应监听窗口 resize，并在选中任务、项目编辑开关或任务筛选变化后重新测量。
- 服务端渲染不是当前项目形态；浏览器环境下 `useLayoutEffect` 可用于减少闪动。
