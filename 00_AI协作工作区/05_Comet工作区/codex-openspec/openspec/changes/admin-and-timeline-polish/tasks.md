## 1. CloudBase 新任务保存修复

- [x] 1.1 拆分 `assertWriteSucceeded` 为 `assertSetSucceeded`（只检查 code）和 `assertUpdateSucceeded`（检查 code + updated:0）。
- [x] 1.2 `saveDocument` 中 `set` 路径使用 `assertSetSucceeded`，`update` 路径使用 `assertUpdateSucceeded`。
- [x] 1.3 添加回归测试：新任务 `set` 返回 `{ updated: 0 }` 时不应报错。

## 2. 风险任务栏固定高度

- [x] 2.1 `.risk-pill` 设置固定 `min-height`，任务名允许换行。
- [x] 2.2 `.risk-list` 去掉水平滚动，改为 `flex-wrap: wrap`。

## 3. 时间轴当前日期左对齐

- [x] 3.1 `ProjectTimeline.tsx` 把当前日期从 `timeline-axis` 移到标题行下方单独一行，左对齐。
- [x] 3.2 CSS 去掉 `timeline-axis` 的 `justify-content: center` 和 `padding-left`。

## 4. 归档列表紧凑排列

- [ ] 4.1 检查并修复归档列表中的空隙。
- [ ] 4.2 调整 `.admin-task-list` gap。

## 5. 删除任务功能

- [ ] 5.1 `ProjectRepository` 接口新增 `deleteTask`。
- [ ] 5.2 `LocalProjectRepository` 和 `CloudBaseProjectRepository` 实现 `deleteTask`。
- [ ] 5.3 `CloudBaseDocumentReferenceLike` 接口新增 `remove()`。
- [ ] 5.4 `projectAdminService.ts` 新增 `deleteProjectTask`。
- [ ] 5.5 `AdminPage.tsx` 已归档任务操作区添加"删除任务"按钮。
- [ ] 5.6 添加回归测试覆盖 `deleteTask`。

## 6. 项目时间范围自动计算

- [ ] 6.1 `validateProject` 新增可选 `taskDateRange` 参数，验证日期范围约束。
- [ ] 6.2 `saveProjectMetadata` 获取任务列表计算 dateRange 并传入验证。
- [ ] 6.3 `AdminPage.tsx` 取消勾选"确认修改项目信息"时自动计算项目日期。
- [ ] 6.4 `dashboardMetrics.ts` timelineRange 优先使用任务实际日期范围。
- [ ] 6.5 添加回归测试覆盖日期范围验证和时间轴范围计算。

## 7. Records and verification

- [ ] 7.1 Update VERSION and CHANGELOG.
- [ ] 7.2 Run focused tests.
- [ ] 7.3 Run full web tests and build.
