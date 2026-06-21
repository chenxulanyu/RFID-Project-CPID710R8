# Claude审查-admin-and-timeline-polish-v1.0

**审查日期**：2026-06-20
**被审查版本**：`admin-and-timeline-polish v1.0`
**审查者**：Claude Code（只读 Reviewer）
**提交**：`8b918a5`

---

## Summary

- **整体判断**：**有条件通过**
- **一句话结论**：`saveDocument` set 路径不检查 `updated:0` 是正确的（`set()` 不返回此字段），`validateProject` 任务日期范围校验正确，`autoAdjustProjectDates` 时机合理，`deleteTask` + `remove?()` 防护到位。但 `buildDashboardModel` 中 `timelineRange.endDate` 使用了 `project.plannedEndDate` 而非 `computeTimelineRange` 返回的 `endDate`，导致当任务日期超出项目周期时，标题日期与条形条基准不一致。需修复后通过。

---

## Blocking Issue

### B1. `timelineRange.endDate` 未使用 `computeTimelineRange` 的计算结果

- **严重级别**：🟡 中
- **文件**：[dashboardMetrics.ts:165-168](web/src/features/project/dashboardMetrics.ts#L165-L168)
- **证据**：

  ```typescript
  // L132: computeTimelineRange 返回 { startDate, endDate, totalDays }
  // 当任务 plannedEndDate > project.plannedEndDate 时，
  //   endDate = 任务的更晚日期, totalDays = 基于扩展范围的天数
  const { startDate: rangeStart, endDate: rangeEnd, totalDays } = computeTimelineRange(project, tasks);

  // L159-171:
  return {
    // ...
    timelineRange: {
      startDate: rangeStart,    // ✅ 用了 computeTimelineRange 的 startDate
      endDate: project.plannedEndDate,  // ❌ 没用 rangeEnd！直接用 project 的
      totalDays,                // ✅ 但 totalDays 又是基于扩展范围的
      todayPercent: buildTodayPercent(rangeStart, today, totalDays),
    },
  };
  ```

- **影响**：当任务的 `plannedEndDate` 超出项目 `plannedEndDate` 时：
  - 条形条的 `totalDays` 基于是扩展后的范围（包含超出的任务日期）
  - 页面标题显示 "2026-03-30 至 2026-09-28"（项目日期），而不是实际的范围
  - **标题日期与条形条的时间基准产生偏差**

- **建议**：[L167](web/src/features/project/dashboardMetrics.ts#L167)：`endDate: project.plannedEndDate` → `endDate: rangeEnd`

---

## 逐项审查

### 1. `saveDocument` set 路径不检查 `updated:0` ✅ 正确

[cloudbaseProjectRepository.ts:199-216](web/src/services/cloudbaseProjectRepository.ts#L199-L216)

`set()` 是 CloudBase 的插入操作，返回值不包含 `{ updated: 0 }` 语义（那属于 `update`）。set 路径只检查 `code` 字符串错误，不调用 `assertWriteSucceeded`（该函数检查 `updated:0`）。**设计正确。** ✅

**`saveProjectDocument` 特殊路径** [L218-236](web/src/services/cloudbaseProjectRepository.ts#L218-L236)：当 `existing.documentId !== project.id` 时（CloudBase 自动 `_id` ≠ 用户设置的 `id`），`update` 返回 `updated:0` 时做一次 `set(project.id)` fallback。**这是正确的——auto `_id` 和 logical `id` 不一致的特殊处理。** ✅

### 2. `validateProject` 任务日期范围校验 ✅

[projectAdminService.ts:13-31](web/src/services/projectAdminService.ts#L13-L31) → [projectValidation.ts:30-42](web/src/services/projectValidation.ts#L30-L42)

- `saveProjectMetadata` 收集所有非归档任务的 `plannedStartDate` 和 `plannedEndDate`
- 提取最早的开始日期和最晚的结束日期作为 `taskDateRange`
- `validateProject` 校验：项目开始不能晚于任务最早开始、项目结束不能早于任务最晚结束

**边界**：归档任务被排除（`!t.isArchived`），所以归档任务不会限制项目日期范围 ✅

### 3. `autoAdjustProjectDates` 时机 ✅

[AdminPage.tsx:270-274](web/src/features/project/AdminPage.tsx#L270-L274)

```tsx
onChange={(event) => {
    const next = event.target.checked;
    setProjectEditEnabled(next);
    if (!next) autoAdjustProjectDates();  // 取消勾选时触发
}}
```

- 收集 `tasks`（后台完整数据）的全部任务日期
- 发现项目日期不等于任务日期范围时，自动更新 `project`
- **仅在取消编辑确认时触发**，不在保存流程中自动触发 → 用户有明确预期 ✅

### 4. `deleteTask` 功能 ✅

| 检查项 | 状态 |
|---|---|
| `ProjectRepository.deleteTask` 接口新增 | ✅ [projectRepository.ts:20](web/src/services/projectRepository.ts#L20) |
| `LocalProjectRepository.deleteTask` 实现 | ✅ L165，从 `snapshot.tasks` 中 splice |
| `CloudBaseProjectRepository.deleteTask` | ✅ L312-321，先检查 `remove` 存在，再检测 `code` 错误 |
| `CloudBaseDocumentReferenceLike.remove?()` 可选 | ✅ ，`deleteTask` 调用前显式检查 `if (!reference.remove)` |
| `deleteProjectTask` service 封装 | ✅ [projectAdminService.ts:53-58](web/src/services/projectAdminService.ts#L53-L58) |
| AdminPage 删除按钮 | ✅ 仅在 `isArchived` 时显示，`handleDelete` → `reload(undefined, "archived")` |

**删除后自动切到 "已归档" 筛选**：`reload(undefined, "archived")`。删除按钮仅在已归档任务时显示，所以 `reload` 到 `"archived"` 是准确的——展示删除后的归档列表。✅

### 5. 风险任务栏 `.risk-pill` ✅

[styles.css:204-239](web/src/styles.css)：`flex: 0 0 220px` + `grid-template-rows: auto minmax(34px, 1fr) auto` + `min-height: 104px` + `overflow-wrap: anywhere`

| 视口 | 行为 |
|---|---|
| 桌面 1440px | 6-7 个 pill 水平排列，`overflow-x: auto` 提供滚动 |
| 手机横屏 844px | ~3 个 pill 可见，其余可滚动 |
| 手机竖屏 | LandscapeGate 旋转 |

`overflow-wrap: anywhere` + `min-height: 104px` + 三行 grid → 长任务名自动换行，不会溢出 ✅

### 6. 时间轴 CSS 残留 ✅

v1.0 移除了 `timeline-today` marker 和 `timeline-axis` 中起始/结束日期 spans。当前 `timeline-axis` 简化为居中显示，但 CSS 选择器 `.timeline-axis` 和 `.timeline-axis strong` 保留供当前日期文本使用。

`ProjectTimeline` 不再用 `timeline-axis`，改用 `section-heading-row` 展示当前日期。`styles.css` 中 `.timeline-axis` 选择器仍存在但仅在 `timeline-frame` 内部被使用，无残留依赖风险。**清理工作可通过后续重构进行。** ✅

---

## 附带评价

### 优点

- **`findDocument` + `findDocumentByLogicalId`**：当 CloudBase 用自动 `_id`（非用户 `id`）创建文档时，通过 `where({ id: logicalId })` 查询找到实际文档。这是解决之前 `_id` 匹配问题的正解。
- **`getProject` try/catch**：CloudBase 读取失败时 fallback 到种子默认值，避免白屏。
- **`listTaskInputs` try/catch**：云端读取失败时使用 `cloudTasks = []`，`mergeTaskInputs` 转为纯种子数据，页面不崩溃。
- **`isUpdatedZero` 提取为单独方法**：`assertWriteSucceeded` 和 `saveProjectDocument` 中复用。

---

## Test and Command Results

| 命令 | 结果 |
|---|---|
| `npm test` | ✅ **80/80 通过**（13 文件，1.48s） |
| `npm run build` | ✅ 通过 |

---

## 结论

`admin-and-timeline-polish v1.0` **有条件通过**。

- `saveDocument` set 路径不检查 `updated:0` ✅
- `validateProject` 任务日期范围校验 ✅
- `autoAdjustProjectDates` 时机 ✅
- `deleteTask` + `remove?()` 防护 ✅
- `risk-pill` 溢出控制 ✅
- **B1**: `timelineRange.endDate` 应使用 `computeTimelineRange` 返回的 `rangeEnd` 而非 `project.plannedEndDate` ⚠️

B1 修复一行即可通过：`endDate: rangeEnd`。
