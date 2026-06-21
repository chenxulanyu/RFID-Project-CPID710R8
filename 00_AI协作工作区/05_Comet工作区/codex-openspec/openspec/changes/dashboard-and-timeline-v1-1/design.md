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
