## Why

后台维护页的左侧任务列表在“已归档”筛选下高度正常，但切换到“活跃任务”后会被大量任务行撑高，导致左侧框明显长于右侧“项目信息 + 任务详情”组合区域。这个行为违背了已确认的维护页布局要求：筛选条件不应改变任务列表框高度，任务多时应在列表内部滚动。

## What Changes

- 修复后台维护页左侧任务列表高度计算，使活跃任务和已归档任务使用同一列表框高度。
- 让活跃任务过多时只在 `.admin-task-list` 内部滚动，而不是撑高整个左侧 panel 或 admin grid 行。
- 增加回归测试锁定“列表框高度不由任务条目数量撑高”的 CSS/组件约束。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin-progress-management`: 明确任务列表切换筛选时高度保持一致，活跃任务数量较多时列表内部滚动。

## Impact

- Affected frontend UI: admin maintenance layout.
- Affected tests: admin layout/style regression tests.
- No CloudBase persistence, deployment configuration, data schema, seed data, dashboard metrics, or public frontend display changes are in scope.
