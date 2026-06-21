# Design

## 1. CloudBase 新任务保存修复

`saveDocument` 里 `set` 路径不检查 `updated: 0`，只有 `update` 才检查。拆 `assertWriteSucceeded` 为 `assertUpdateSucceeded`（检查 code + updated:0）和 `assertSetSucceeded`（只检查 code）。

## 2. 风险任务栏固定高度

风险卡片 `.risk-pill` 使用固定高度 `min-height: 104px`，任务名称允许换行（去掉 `white-space: nowrap` + `overflow: hidden`，改用 `overflow-wrap: anywhere`）。风险列表 `.risk-list` 去掉 `overflow-x: auto`，改为 `flex-wrap: wrap`，防止滚动。

## 3. 时间轴当前日期左对齐

`ProjectTimeline.tsx` 中把当前日期从 `timeline-axis` 移到 `section-heading-row` 下方单独一行，左对齐。CSS 去掉 `timeline-axis` 的 `justify-content: center` 和 `padding-left`。

## 4. 归档列表紧凑排列

检查 `AdminPage.tsx` 中 `visibleTasks` 过滤逻辑，确保不渲染空任务。CSS 调整 `.admin-task-list` gap 从 8px 减小，去掉可能的空 `li` 高度。

## 5. 删除任务功能

- `ProjectRepository` 接口新增 `deleteTask(taskId: string): Promise<void>`。
- `LocalProjectRepository`：从 snapshot.tasks 中移除对应任务。
- `CloudBaseProjectRepository`：调用 `doc(taskId).remove()`。
- `CloudBaseDocumentReferenceLike` 接口新增 `remove(): Promise<unknown>`。
- `projectAdminService.ts` 新增 `deleteProjectTask`。
- `AdminPage.tsx` 在已归档任务的操作按钮区添加"删除任务"按钮。

## 6. 项目时间范围自动计算

- `validateProject` 新增可选参数 `taskDateRange?: { earliestStart: string; latestEnd: string }`，验证项目开始不晚于最早任务、项目结束不早于最晚任务。
- `saveProjectMetadata` 在调用 `validateProject` 前先获取任务列表计算 dateRange。
- `AdminPage.tsx` 在用户取消"确认修改项目信息"勾选时，自动计算项目日期为任务日期范围。
- `dashboardMetrics.ts` 的 `buildDashboardModel` 中，timelineRange 优先使用任务实际日期范围，而非只依赖 project 字段。

## Verification

新增/更新测试覆盖：
- `set` 操作不检查 `updated: 0`
- `deleteTask` 在 Local 和 CloudBase repository 中的行为
- 项目日期范围验证
- 管理页面删除按钮渲染
