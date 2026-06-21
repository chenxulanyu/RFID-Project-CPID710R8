## Why

项目仪表盘里的时间轴和任务进度标签在某些宽度下会出现百分比尾部缺失或显示不完整的情况，导致完成度信息不够直观。这个问题会直接影响用户对甘特图和任务进度的快速判断。

## What Changes

- 统一时间轴、任务明细表以及相关进度标签的百分比显示格式，确保始终带有 `%` 后缀。
- 保持现有进度计算、时间轴长度计算和条形位置算法不变，只修正可见标签与容器适配问题。
- 保持桌面端、手机横屏和其他受支持视口下的百分比标签可读性。

## Capabilities

### Modified Capabilities
- `project-dashboard-display`: 任务进度百分比与时间轴进度标签的可见文本需要稳定显示为百分比格式，并保持在容器内可读。

## Impact

- 受影响代码：`web/src/features/project/ProjectTimeline.tsx`、`web/src/features/project/TaskDetailTable.tsx`、相关样式和测试。
- 受影响用户体验：时间轴、甘特条、任务明细中的完成比例文本显示。
