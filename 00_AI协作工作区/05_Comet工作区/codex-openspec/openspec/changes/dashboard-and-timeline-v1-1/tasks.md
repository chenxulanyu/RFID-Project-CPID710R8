# Tasks: dashboard-and-timeline-v1.1

## 1. 仪表盘"未启动"指标
- [x] 1.1 `ProjectSummaryDashboard.tsx`：`metric-grid` 新增"未启动"卡片

## 2. 后台里程碑/TaskID 对调
- [x] 2.1 `AdminPage.tsx`：表单中交换里程碑和任务 ID 的输入位置

## 3. 时间轴双条形对比
- [x] 3.1 `types/project.ts`：扩展 `DashboardTask.timeline` 为 `{ plan, actual? }`
- [x] 3.2 `dashboardMetrics.ts`：`buildTimeline` 返回 `plan` 和 `actual` 子对象
- [x] 3.3 `ProjectTimeline.tsx`：每条 timeline-row 渲染两条 bar（蓝+红）
- [x] 3.4 `styles.css`：新增 `.timeline-bar-plan` 和 `.timeline-bar-actual` 样式

## 4. 隐藏后台入口按钮
- [x] 4.1 `App.tsx`：移除导航栏"后台维护"链接
- [x] 4.2 `App.test.tsx`：更新导航栏测试

## 5. 资源方/责任人非必填
- [x] 5.1 `projectValidation.ts`：`validateTaskInput` 移除必填检查
- [x] 5.2 `cloudbaseProjectRepository.ts`：`hasRequiredTaskDocumentFields` 移除必填检查
- [x] 5.3 `AdminPage.test.tsx`：更新验证测试用例

## 6. 项目周期自动扩展
- [x] 6.1 `AdminPage.tsx`：`reload` 中自动调整项目日期
- [x] 6.2 验证约束逻辑已在 `projectValidation.ts` 和 `projectAdminService.ts` 中

## 7. 回归验证
- [x] 7.1 全量测试 81/81 通过
- [x] 7.2 `npm run build` 通过
- [ ] 7.3 Claude Code 审查
