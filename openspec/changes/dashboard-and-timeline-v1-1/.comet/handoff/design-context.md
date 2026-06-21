# Comet Design Handoff

- Change: dashboard-and-timeline-v1-1
- Phase: design
- Mode: compact
- Context hash: c4fd24db1ec67915fddb7820652849d630dc0676d0000076d05f4e5df2b13204

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/dashboard-and-timeline-v1-1/proposal.md

- Source: openspec/changes/dashboard-and-timeline-v1-1/proposal.md
- Lines: 1-27
- SHA256: 5091cbe971cd9815d63fe271c4d1df6d4ef3a61b0bacd7ddfa6a1ba8ce62af7a

```md
# Proposal: dashboard-and-timeline-v1.1

## 背景

v1.0 版本已完成项目仪表盘、后台维护、CloudBase 数据持久化和扣子部署。用户提出 v1.1 的 6 项改进需求。

## 目标

| # | 需求 | 说明 |
|---|------|------|
| 1 | 仪表盘增加"未启动"指标 | 在 metric-grid 中新增统计卡片，计数所有 `actualStartDate` 为空的未归档任务 |
| 2 | 后台里程碑/TaskID 对调 | 后台维护表单中，先输入里程碑，再输入任务 ID（保留里程碑字段） |
| 3 | 时间轴双条形对比 | 计划时间用蓝色宽条，实际时间用红色窄条，居中重叠在同一轨道上；无实际日期仅显示蓝色条 |
| 4 | 隐藏后台入口按钮 | 导航栏移除"后台维护"链接，改为手动地址栏输入 `/admin` |
| 5 | 资源方/责任人非必填 | `resourceOwner` 和 `responsiblePerson` 改为可选字段，后端验证移除其必填要求 |
| 6 | 项目周期自动扩展 | 项目计划周期根据所有任务的最早/最晚日期自动调整；后台可设更长时间但不得短于任务范围 |

## 范围

- **涉及文件**：~14 个（类型定义、种子数据、仪表盘指标计算、前端组件、后端验证、CSS、测试）
- **不涉及**：CloudBase 数据库结构、移动端横屏行为、扣子部署配置

## 非目标

- 不改 CloudBase 存储结构
- 不改变甘特图或任务明细表格
- 不引入新的 npm 依赖
```

## openspec/changes/dashboard-and-timeline-v1-1/design.md

- Source: openspec/changes/dashboard-and-timeline-v1-1/design.md
- Lines: 1-63
- SHA256: e4c8338ed891eaad6922ed94f8eeb89f2d162941a23ed7bee2ac42bc057e4daf

```md
# Design: dashboard-and-timeline-v1.1

## 1. 仪表盘"未启动"指标

在 `ProjectSummaryDashboard.tsx` 的 `metric-grid` 中新增一张卡片，展示 `metrics.notStartedTasks`。放在"延迟启动"卡片之后。

## 2. 后台里程碑/TaskID 对调

`AdminPage.tsx` 表单中交换里程碑和任务 ID 两个 `<label>` 的 JSX 顺序。不改变数据模型、验证逻辑或后端。

## 3. 时间轴双条形对比

**数据层**：扩展 `DashboardTask.timeline` 为：
```ts
timeline: {
  plan: { leftPercent, widthPercent },
  actual?: { leftPercent, widthPercent },
  percent: string,
}
```

**渲染层**：每个 `.timeline-track` 渲染两条 bar，蓝条（计划 12px）+ 红条（实际 6px 居中重叠）。无实际日期不渲染红条。

```css
.timeline-bar-plan  { height: 12px; background: #3b82f6; }
.timeline-bar-actual { height: 6px; background: #ef4444; margin-top: 3px; }
```

## 4. 隐藏后台入口按钮

`App.tsx` 导航栏移除 `<a href="/admin">后台维护</a>`。路由逻辑不变。

## 5. 资源方/责任人非必填

- `projectValidation.ts`：移除 `resourceOwner` 和 `responsiblePerson` 的必填校验
- `cloudbaseProjectRepository.ts`：`hasRequiredTaskDocumentFields` 移除对两者的检查

## 6. 项目周期自动扩展

**自动扩展**：当新增/修改任务后，项目 `plannedStartDate` 取所有任务的最早日期，`plannedEndDate` 取最晚日期。

**后台约束**：编辑项目时：
- `plannedStartDate` 可设为 ≤ 任务最早日期（可以更早开始）
- `plannedEndDate` 可设为 ≥ 任务最晚日期（可以更晚结束）
- 违反约束 → 报错，阻止保存

**实现**：`saveProjectMetadata` 中计算 `taskDateRange` 传入 `validateProject`，`validateProject` 中增加范围校验。取消勾选"确认修改项目信息"时触发 `autoAdjustProjectDates`。

## 涉及文件

| 文件 | 需求 |
|------|------|
| `types/project.ts` | 3 |
| `dashboardMetrics.ts` | 1, 3 |
| `ProjectSummaryDashboard.tsx` | 1 |
| `ProjectTimeline.tsx` | 3 |
| `App.tsx` | 4 |
| `AdminPage.tsx` | 2, 6 |
| `projectValidation.ts` | 5, 6 |
| `projectAdminService.ts` | 6 |
| `cloudbaseProjectRepository.ts` | 5 |
| `styles.css` | 1, 3, 4 |
| 对应测试文件 | 全部 |
```

## openspec/changes/dashboard-and-timeline-v1-1/tasks.md

- Source: openspec/changes/dashboard-and-timeline-v1-1/tasks.md
- Lines: 1-40
- SHA256: 94d5ce73c7077f3023f4c3a298508859aa931b5c91b9cbf57178c5ed89ad1d5e

```md
# Tasks: dashboard-and-timeline-v1.1

## 1. 仪表盘"未启动"指标

- [ ] 1.1 `ProjectSummaryDashboard.tsx`：`metric-grid` 新增"未启动"卡片

## 2. 后台里程碑/TaskID 对调

- [ ] 2.1 `AdminPage.tsx`：表单中交换里程碑和任务 ID 的输入位置

## 3. 时间轴双条形对比

- [ ] 3.1 `types/project.ts`：扩展 `DashboardTask.timeline` 为 `{ plan, actual? }`
- [ ] 3.2 `dashboardMetrics.ts`：`computeTimeline` 返回 `plan` 和 `actual` 子对象
- [ ] 3.3 `ProjectTimeline.tsx`：每条 timeline-row 渲染两条 bar（蓝+红）
- [ ] 3.4 `styles.css`：新增 `.timeline-bar-plan` 和 `.timeline-bar-actual` 样式

## 4. 隐藏后台入口按钮

- [ ] 4.1 `App.tsx`：移除导航栏"后台维护"链接
- [ ] 4.2 `App.test.tsx`：更新导航栏测试

## 5. 资源方/责任人非必填

- [ ] 5.1 `projectValidation.ts`：`validateTaskInput` 移除 `resourceOwner` 和 `responsiblePerson` 的必填检查
- [ ] 5.2 `cloudbaseProjectRepository.ts`：`hasRequiredTaskDocumentFields` 移除对两者的必填检查
- [ ] 5.3 `AdminPage.test.tsx`：更新验证测试用例

## 6. 项目周期自动扩展

- [ ] 6.1 `projectValidation.ts`：`validateProject` 增加任务日期范围约束
- [ ] 6.2 `projectAdminService.ts`：`saveProjectMetadata` 计算任务日期范围并传入验证
- [ ] 6.3 `AdminPage.tsx`：取消勾选"确认修改项目信息"时触发自动日期调整
- [ ] 6.4 更新相关测试

## 7. 回归验证

- [ ] 7.1 运行全量测试
- [ ] 7.2 运行 `npm run build`
- [ ] 7.3 Claude Code 审查
```

