# Claude审查-status-center-progress-countdown-v1-2

**审查日期**：2026-06-21
**被审查版本**：status-center-progress-countdown-v1-2
**审查者**：Claude Code（只读 Reviewer）
**Base**：`204f74a` → HEAD `f8692e9`

---

## Summary

- **整体判断**：❌ **不通过**
- **一句话结论**：代码改动本身正确（3 项调整逻辑合理），但 `getNotStartedCountdownLabel` 去"距"字后未同步更新 2 处测试断言，导致测试回归。

---

## Blocking Issue

### B1. 去"距"字后 2 处测试断言未同步更新 🔴

**改动的代码**（[dashboardMetrics.ts:69](web/src/features/project/dashboardMetrics.ts#L69)）：

```diff
- if (cmp < 0) return `距${calculateCalendarDays(today, task.plannedEndDate) - 1}天`;
+ if (cmp < 0) return `${calculateCalendarDays(today, task.plannedEndDate) - 1}天`;
```

**未更新的测试**：

| 文件 | 行号 | 旧断言 | 应改 |
|---|---|---|---|
| `dashboardMetrics.test.ts` | L409 | `.toBe("距9天")` | `.toBe("9天")` |
| `dashboardMetrics.test.ts` | L460 | `.toEqual(["未开始（距9天）"])` | `.toEqual(["未开始（9天）"])` |

另外 `TaskDetailTable.test.tsx` L78 中 `riskLabels: ["未开始（距9天）"]` 是测试输入数据，会传到 `getRiskLabels` → `getNotStartedCountdownLabel`，产生 `"9天"`，然后组装为 `"未开始（9天）"`。该测试断言的是 `textContent` 匹配，需要确认是否受影响。

**修复**：同步更新以上测试断言的文本。3 处：

1. `dashboardMetrics.test.ts:409` → `"9天"`
2. `dashboardMetrics.test.ts:460` → `["未开始（9天）"]`
3. `TaskDetailTable.test.tsx:78` → `riskLabels: ["未开始（9天）"]`

---

## 其余审查 ✅（除 B1 外均正确）

### 1. 状态列居中 ✅

```css
td.col-center .status-badge {
  justify-content: center;
}
```

- `.status-badge` 是 `display: inline-flex`，`text-align: center` 不生效（仅影响行内/文本内容，不影响 flex 容器）
- `justify-content: center` 使 flex 子标签在 badge 内居中 ✅
- 选择器 `td.col-center .status-badge` 限定 `<td>` 内，不影响 RiskTaskStrip 的 badge ✅

### 2. 进度条 100% 深绿色 ✅

```tsx
<span className={task.completionRatio >= 1 ? "progress-complete" : ""} ... />
```

```css
.progress-track span.progress-complete {
  background: #2d7d46;
}
```

边界分析：

| completionRatio | 来源 | `>= 1`？ |
|---|---|---|
| `1` | `isFinished ? 1`（精确） | ✅ true |
| `0.95` | `calculateCompletionRatio`（capped） | ❌ false |
| `0.99` | `min(elapsed/planned, 0.95)` → 实际 ≤0.95 | ❌ false |
| `manualCompletionRatio` | `sanitizeTaskForSave` 钳位 [0,1] | 仅 `1` 时 true |

`>= 1` 比 `=== 1` 更稳健——防御性处理任何可能的浮点精度问题 ✅

颜色 `#2d7d46`（深绿）比默认 `#2f80c0`（蓝）更有完成语义 ✅

### 3. 去"距"字 ✅

`"未开始（距9天）"` → `"未开始（9天）"`。在项目仪表盘语境中，括号内数字 + "天" 与父标签"未开始"结合，语义清晰：还差 9 天到截止日期。`"距"` 字确属冗余 ✅

### 4. 范围控制 ✅

严格 3 文件，未触及无关代码 ✅

---

## 测试与构建

| 命令 | 结果 |
|---|---|
| `npm test --workspace web` | ❌ **2 failed / 122 passed**（dashboardMetrics.test.ts 两处"距"断言失败） |
| `npm run build` | ✅ 通过 |

---

## 结论

❌ **不通过**。代码逻辑正确，但去"距"字后未同步更新 `dashboardMetrics.test.ts` 中 2 处测试断言（L409、L460）以及 `TaskDetailTable.test.tsx` L78 的测试数据。修复后可通过。
