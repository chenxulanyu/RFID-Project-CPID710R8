# Claude Code 审查指令：dashboard-and-timeline-v1-1

请作为只读 Reviewer 审查本次 v1.1 的 6 项改进。以下是开发内容概要：

## 改动汇总（12 文件，+78/-34 行）

### 1. 仪表盘"未启动"指标
- [ProjectSummaryDashboard.tsx](/Users/mac/Vibe%20Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/ProjectSummaryDashboard.tsx:43)：在 metric-grid 末尾新增"未启动"卡片，展示 `metrics.notStartedTasks`（该字段已在数据层计算）

### 2. 后台里程碑/TaskID 对调
- [AdminPage.tsx](/Users/mac/Vibe%20Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/AdminPage.tsx:347)：交换里程碑和任务 ID 两个 label 的 JSX 顺序

### 3. 时间轴双条形对比
- [dashboardMetrics.ts](/Users/mac/Vibe%20Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/dashboardMetrics.ts:10)：`DashboardTask.timeline` 类型扩展为 `{ plan: {leftPercent, widthPercent}, actual?: {...}, percent: number }`
- [dashboardMetrics.ts:88](/Users/mac/Vibe%20Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/dashboardMetrics.ts:88)：`buildTimeline` 函数重写，返回 plan + actual + percent
- [ProjectTimeline.tsx](/Users/mac/Vibe%20Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/ProjectTimeline.tsx:24)：渲染蓝条(.timeline-bar-plan) + 红条(.timeline-bar-actual)，无实际日期不渲染红条
- [styles.css](/Users/mac/Vibe%20Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/styles.css:399)：蓝条 12px/#3b82f6，红条 6px/#ef4444 居中重叠(margin-top:3px)

### 4. 隐藏后台入口按钮
- [App.tsx](/Users/mac/Vibe%20Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/app/App.tsx:17)：移除导航栏 `<a href="/admin">后台维护</a>`，路由逻辑不变

### 5. 资源方/责任人非必填
- [projectValidation.ts](/Users/mac/Vibe%20Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/services/projectValidation.ts:49)：移除 `resourceOwner` 和 `responsiblePerson` 的必填校验
- [cloudbaseProjectRepository.ts](/Users/mac/Vibe%20Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/services/cloudbaseProjectRepository.ts:97)：`hasRequiredTaskDocumentFields` 移除两者检查

### 6. 项目周期自动扩展
- [AdminPage.tsx](/Users/mac/Vibe%20Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/AdminPage.tsx:125)：`reload` 函数末尾新增自动日期调整逻辑——若活跃任务的最早/最晚日期超出项目当前范围，自动扩展项目周期

## 验证结果
- `npm test --workspace web`：81/81 通过
- `npm run build --workspace web`：通过

## 审查重点
1. `buildTimeline` 的 `actual` 计算是否正确处理了无实际日期的边界
2. 时间轴 CSS 红色窄条是否可能溢出蓝色宽条
3. 需求 6 的自动日期调整是否仅基于活跃任务（`!t.isArchived`），归档的不会影响
4. 需求 5 移除必填后，CloudBase 旧文档中有空 resourceOwner 是否会导致 `hasRequiredTaskDocumentFields` 行为不一致
