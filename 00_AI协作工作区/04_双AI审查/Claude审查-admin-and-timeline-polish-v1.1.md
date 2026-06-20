# Claude审查-admin-and-timeline-polish-v1.1

**审查日期**：2026-06-20
**被审查版本**：`admin-and-timeline-polish v1.0` + B1 修复
**审查者**：Claude Code（只读 Reviewer）
**提交**：`5121c8c`

---

## Summary

- **整体判断**：✅ **通过**
- **一句话结论**：B1 修复准确——`timelineRange.endDate` 从 `project.plannedEndDate` 改为 `rangeEnd`，与 `startDate: rangeStart`、`totalDays`、`todayPercent` 的计算基准完全一致，消除了任务日期超出项目周期时标题与条形条的时间偏差。

---

## B1 修复验证

### 修复内容

[dashboardMetrics.ts:167](web/src/features/project/dashboardMetrics.ts#L167)

```diff
  timelineRange: {
    startDate: rangeStart,
-   endDate: project.plannedEndDate,
+   endDate: rangeEnd,
    totalDays,
    todayPercent: buildTodayPercent(rangeStart, today, totalDays),
  },
```

### 逻辑正确性

`computeTimelineRange`（[L105-121](web/src/features/project/dashboardMetrics.ts#L105-L121)）的计算逻辑：

```
startDate = min(project.plannedStartDate, earliestTaskStart)
endDate   = max(project.plannedEndDate, latestTaskEnd)
totalDays = calendarDays(startDate, endDate)
```

修复后 `timelineRange` 的四个字段全部基于 `computeTimelineRange` 的返回值：

| 字段 | 修复前 | 修复后 | 一致性 |
|---|---|---|---|
| `startDate` | `rangeStart` ✅ | `rangeStart` ✅ | — |
| `endDate` | `project.plannedEndDate` ❌ | `rangeEnd` ✅ | 与 startDate 对称 |
| `totalDays` | 基于扩展范围 | 基于扩展范围 | 与 rangeEnd 匹配 |
| `todayPercent` | 基于扩展范围 | 基于扩展范围 | 与 rangeEnd 匹配 |

**修复前的不一致**：当 `latestTaskEnd > project.plannedEndDate` 时，`totalDays` 基于扩展范围计算（包含超出的任务日期），但 `endDate` 仍显示项目日期——标题显示 2026-09-28，条形条实际延伸到 2026-10-15，基准错位。

**修复后**：`endDate` 与 `totalDays` 使用同一范围，标题和条形条的时间基准一致。

### 影响范围

- **仅改一行**，无副作用
- `buildTimeline`（[L87-94](web/src/features/project/dashboardMetrics.ts#L87-L94)）使用 `rangeStart` + `totalDays` 计算 `leftPercent` / `widthPercent`，不依赖 `endDate`，修复不影响条形条位置计算
- `buildTodayPercent`（[L96-99](web/src/features/project/dashboardMetrics.ts#L96-L99)）同理，仅依赖 `rangeStart` + `totalDays`
- `endDate` 仅用于 UI 展示（标题日期文本），修复只影响展示一致性

### 边界场景

| 场景 | `computeTimelineRange` 返回 | 修复后 `endDate` |
|---|---|---|
| 任务日期在项目范围内 | `endDate = project.plannedEndDate` | `rangeEnd` = `project.plannedEndDate`，与修复前相同 ✅ |
| 任务结束日期超出项目 | `endDate = latestTaskEnd` | `rangeEnd` = `latestTaskEnd`，正确扩展 ✅ |
| 任务开始日期早于项目 | `startDate = taskStart`，`endDate` 不受影响 | 行为不变 ✅ |
| 无任务 | `endDate = project.plannedEndDate` | 与修复前相同 ✅ |

---

## 测试与构建

| 命令 | 结果 |
|---|---|
| `npm test --workspace web` | ✅ **80/80 通过**（13 文件，1.58s） |
| `npm run build --workspace web` | ✅ 通过（150ms） |

---

## 结论

B1 修复**准确、最小、无副作用**。`timelineRange.endDate` 现在与 `startDate`、`totalDays`、`todayPercent` 使用同一计算范围，消除了任务日期超出项目周期时标题与条形条的时间偏差。

`admin-and-timeline-polish v1.0` **全部审查项通过**，无需进一步修改。
