# Tasks: dashboard-cloudbase-ui-polish

## 1. 修复前台 CloudBase 任务读取回退
- [x] 1.1 在 `web/src/services/projectService.test.ts` 增加失败用例：仓库返回一条资源方/责任人为空但其他必填字段完整的新任务时，`getProjectProgress` 返回该任务且不回退到默认 31 条种子任务
- [x] 1.2 运行聚焦测试，确认测试先失败
- [x] 1.3 修改 `web/src/services/projectService.ts` 的前台任务有效性校验，与后台非必填规则对齐
- [x] 1.4 运行聚焦测试，确认测试通过

## 2. 调整仪表盘 KPI 单行自适应布局
- [x] 2.1 在 `ProjectSummaryDashboard` 或相关测试中增加顺序断言：任务总数之后依次出现延期/临期、延迟启动
- [x] 2.2 增加样式回归测试或文本断言，覆盖 `metric-grid` 桌面单行自适应规则
- [x] 2.3 调整 `ProjectSummaryDashboard.tsx` KPI 顺序
- [x] 2.4 调整 `web/src/styles.css` 中 `.metric-grid` / `.metric-card` 桌面布局，减少无效空白并保护文本不溢出
- [x] 2.5 运行相关测试

## 3. 调整计划时间轴图示和百分比显示
- [x] 3.1 在 `ProjectTimeline.test.tsx` 增加失败用例：显示“计划周期”“实际周期”图示
- [x] 3.2 修改既有时间轴测试：条形内部不再显示 `95%` 或 `100%`
- [x] 3.3 运行聚焦测试，确认新旧期望先失败
- [x] 3.4 修改 `ProjectTimeline.tsx`，新增 legend，移除 `.timeline-percent` 渲染
- [x] 3.5 清理 `styles.css` 中不再使用的 `.timeline-percent` 样式，并完善 legend 样式
- [x] 3.6 运行聚焦测试，确认通过

## 4. 修复后台项目信息面板异常拉伸
- [x] 4.1 增加样式回归测试，覆盖 `.admin-panels` 不拉伸每个 section 到左侧任务列表高度
- [x] 4.2 修改 `styles.css` 后台右侧面板布局，使项目信息 section 按内容高度排列
- [x] 4.3 确认左侧任务列表仍保持可用高度和内部滚动能力
- [x] 4.4 运行相关测试

## 5. 全量验证和审查准备
- [x] 5.1 运行 `npm test --workspace web`
- [x] 5.2 运行 `npm run build --workspace web`
- [x] 5.3 生成可直接发给 Claude Code 的审查指令，要求重点审查 CloudBase 前台回退根因、KPI 布局、时间轴 legend/百分比移除、后台面板高度
- [x] 5.4 等待 Claude Code 审查通过后，再进入归档和推送
