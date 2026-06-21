# Claude审查-dashboard-and-timeline-v1-1（复审）

**审查日期**：2026-06-21
**被审查版本**：dashboard-and-timeline v1.1（B1/B2/M1/C3 全部修复后）
**审查者**：Claude Code（只读 Reviewer）
**分支**：`codex/dashboard-and-timeline-v1-1`

---

## Summary

- **整体判断**：✅ **通过**
- **一句话结论**：所有阻塞和中等问题均已修复，6 项需求可进入提交阶段。

---

## 条件项逐项复核

### B1. actual widthPercent off-by-one → ✅ 已修复

[dashboardMetrics.ts:96](web/src/features/project/dashboardMetrics.ts#L96)

```typescript
widthPercent: clampPercent((Math.max(calculateCalendarDays(task.actualStartDate!, task.actualEndDate!), 1) / totalDays) * 100),
```

- 去掉 `+ 1` ✅
- 加 `Math.max(..., 1)` 与 plan 一致 ✅

### B2. 自动扩展不持久化 → ✅ 已修复

[AdminPage.tsx:141-145](web/src/features/project/AdminPage.tsx#L141-L145)

```typescript
try {
  await saveProjectMetadata(activeRepository, expanded);
} catch {
  setProject(data.project);
}
```

- 持久化调用 `saveProjectMetadata` ✅
- `try/catch` 包裹，失败时回退 state ✅
- 使用 `await`（非 `void`）确保等待结果 ✅

### M1. `void saveProjectMetadata` 失败静默 → ✅ 已修复

改为 `await` + `try/catch`，失败时 `setProject(data.project)` 回退到原始值，state 与持久化保持一致 ✅

### C3. 旧 CSS 死代码 → ✅ 已修复

- `.timeline-bar` 基类已删除 ✅
- `.timeline-bar.status-finished`、`.status-in-progress`、`.status-start-delayed`、`.status-not-started` 4 个状态变体已删除 ✅
- 仅保留 `.timeline-bar-plan` 和 `.timeline-bar-actual` ✅
- 全文搜索 `timeline-bar` 仅命中 `.timeline-bar-plan` 和 `.timeline-bar-actual`，无残留 ✅

---

## 测试与构建

| 命令 | 结果 |
|---|---|
| `npm test --workspace web` | ✅ **81/81 通过**（13 文件，1.55s） |
| `npm run build --workspace web` | ✅ 通过 |

---

## 结论

B1/B2/M1/C3 全部修复。6 项需求（未启动指标、里程碑对调、时间轴双条形、隐藏后台入口、资源方非必填、项目周期自动扩展）✅ 通过，可提交合并到 main。
