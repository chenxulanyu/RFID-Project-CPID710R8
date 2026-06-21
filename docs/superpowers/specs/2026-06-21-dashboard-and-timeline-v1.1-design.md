---
comet_change: dashboard-and-timeline-v1-1
role: technical-design
canonical_spec: openspec
archived-with: 2026-06-21-dashboard-and-timeline-v1-1
status: final
---

# Technical Design: dashboard-and-timeline-v1.1

## 概述

v1.0 之后的六项 UI 与业务逻辑改进，聚焦仪表盘数据完整性、时间轴可视化增强、后台维护体验优化。

## 1. 仪表盘"未启动"指标

**方案**：`ProjectSummaryDashboard.tsx` 的 `metric-grid` 中新增一张卡片，直接使用 `DashboardMetrics.notStartedTasks`（该字段已存在于类型定义中，`buildDashboardModel` 已在计算）。无数据层改动。

## 2. 后台里程碑/TaskID 对调

**方案**：`AdminPage.tsx` 表单 JSX 中交换两个 `<label>` 的位置。不改变数据模型、验证逻辑、CloudBase 映射。

## 3. 时间轴双条形对比

**数据模型变更**：

`DashboardTask.timeline` 从 `{ leftPercent, widthPercent }` 扩展为：
```ts
timeline: {
  plan: { leftPercent: number; widthPercent: number };
  actual?: { leftPercent: number; widthPercent: number };
  percent: string;
}
```

- `plan`：计划周期位置，始终存在
- `actual`：实际周期位置，仅当 `actualStartDate` 和 `actualEndDate` 都存在时计算
- `actual.leftPercent` = `(actualStartDate - timelineStart) / totalDays * 100`
- `actual.widthPercent` = `(actualEndDate - actualStartDate) / totalDays * 100`

**渲染**：

每个 `.timeline-track` 内结构：
```html
<div class="timeline-track">
  <!-- 计划条：蓝色宽条 -->
  <div class="timeline-bar-plan" style="left:X%; width:Y%">
    <span class="timeline-percent">XX%</span>
  </div>
  <!-- 实际条：红色窄条，居中重叠 -->
  <div class="timeline-bar-actual" style="left:X%; width:Y%"></div>
</div>
```

CSS：
- `.timeline-bar-plan`：`height: 12px; background: #3b82f6; border-radius: 4px;`
- `.timeline-bar-actual`：`height: 6px; background: #ef4444; border-radius: 3px; margin-top: 3px;`

## 4. 隐藏后台入口按钮

`App.tsx` 中移除 `<a href="/admin">后台维护</a>`。路由匹配逻辑不变：`pathname === "/admin"` 仍渲染 `AdminPlaceholder`。

## 5. 资源方/责任人非必填

- `projectValidation.ts`：`validateTaskInput` 中删除两行 `requireText`
- `cloudbaseProjectRepository.ts`：`hasRequiredTaskDocumentFields` 中移除 `optionalString(document.resourceOwner)` 和 `optionalString(document.responsiblePerson)` 的 `&&`

## 6. 项目周期自动扩展

**自动调整**：`AdminPage.tsx` 中 `autoAdjustProjectDates` 函数在取消勾选"确认修改项目信息"时触发，将项目 `plannedStartDate`/`plannedEndDate` 设为任务的最早/最晚日期。

**后端约束**：`saveProjectMetadata` 计算 `taskDateRange`（所有活跃任务的 earliestStartDate/latestEndDate），传入 `validateProject`。校验规则：
- `plannedStartDate` 必须 ≤ `earliestStartDate`（可以更早）
- `plannedEndDate` 必须 ≥ `latestEndDate`（可以更晚）
- 违反 → `ProjectValidationError`

### 影响范围

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
| 测试文件 | 全部 |
