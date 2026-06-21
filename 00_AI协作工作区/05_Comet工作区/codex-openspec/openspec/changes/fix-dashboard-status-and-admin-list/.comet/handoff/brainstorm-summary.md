# Brainstorm Summary

- Change: fix-dashboard-status-and-admin-list
- Date: 2026-06-21

## 确认的技术方案

本次修复聚焦三个已确认问题：后台维护左侧任务列表高度、仪表盘生命周期统计不闭合、风险任务卡片颜色不一致。

仪表盘状态语义改为“生命周期状态”和“风险维度”分离。生命周期状态只由实际日期决定：有实际结束日期为已完成；有实际开始日期但无实际结束日期为正在进行；无实际开始日期为未启动。延迟启动不再占用生命周期状态，只作为独立 KPI 和风险标记，判断条件为实际开始日期晚于计划开始日期。

风险任务展示增加独立的延迟启动 warning class。即使任务本身没有临期或延期状态，只要满足延迟启动条件，风险卡片也应有稳定的可见 warning 样式，避免出现白色风险卡片。

后台维护布局改为由 grid 高度拉伸左侧任务列表面板，使它与右侧“项目信息 + 任务详情”组合区域对齐；长列表只在 `.admin-task-list` 内部滚动，不再用旧的 viewport-only `max-height` 把左侧面板截短。

## 关键取舍与风险

- 已完成、正在进行、未启动必须严格覆盖任务明细总数，三者相加应等于 `totalDetailTasks`。
- 延迟启动可以与已完成或正在进行同时成立，这是风险维度和生命周期维度分离后的预期行为。
- 本次不修改 CloudBase 读写、数据 schema、部署配置、seed 数据或远端仓库设置。
- 后台列表高度通过 CSS 布局约束验证，不追求像素级固定高度，以避免破坏响应式布局。

## 测试策略

- 在 dashboard metrics 测试中增加生命周期计数闭合断言。
- 增加延迟启动任务仍按实际日期归入已完成或正在进行的回归测试。
- 增加风险卡片/样式断言，确保延迟启动风险有独立可见样式。
- 增加 CSS 回归测试，确保旧的左侧面板 `max-height: calc(100vh - 220px)` 不再存在，任务列表仍保留内部滚动。
- 最终运行 `npm test --workspace web`、`npm run build --workspace web`、`openspec validate fix-dashboard-status-and-admin-list --strict`、`openspec validate --specs --strict`。

## Spec Patch

无。当前 OpenSpec delta spec 已覆盖本次三个修复点，无需追加新的需求范围。
