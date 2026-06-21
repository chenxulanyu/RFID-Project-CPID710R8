# Brainstorm Summary

- Change: dashboard-status-responsive-polish
- Date: 2026-06-21

## 确认的技术方案

本次优化保持在 dashboard/admin 前端范围内，不修改 CloudBase、部署配置、数据 schema 或种子数据。dashboard 统计口径改为以实际开始日期为核心：只有 `actualStartDate > plannedStartDate` 的任务才计为延迟启动；没有 `actualStartDate` 的任务全部计为未启动。顶部 7 个 KPI 卡片作为固定指标行铺满主内容宽度，桌面与手机横屏均保持单行展示；空间不足时通过紧凑尺寸或横向滚动保护布局，不回退为两列。后台维护左侧任务列表对活跃和已归档过滤使用一致高度约束，列表项过多时在列表内部滚动。

## 关键取舍与风险

- 统计口径会改变既有“延迟启动”数字，但与用户确认的业务语义一致。
- KPI 单行在窄屏横屏可能更紧凑，因此需要最小宽度与横向滚动兜底，避免文字溢出或两列竖排。
- admin 左侧列表高度受 grid/flex 组合影响，需通过 CSS 回归测试固定关键属性，避免后续样式变更重新撑高活跃列表。

## 测试策略

- 在 dashboard metrics 测试中覆盖晚于计划实际启动、无实际启动、实际启动早于或等于计划启动的状态分类。
- 在 CSS 测试中覆盖 KPI 行铺满内容宽度、7 列单行、移动端不回退两列。
- 在 CSS 测试中覆盖 admin 左侧任务列表的固定/受限高度与内部滚动。
- 完成后运行 `npm test --workspace web`、`npm run build --workspace web`、`openspec validate --specs --strict`。

## Spec Patch

无。
