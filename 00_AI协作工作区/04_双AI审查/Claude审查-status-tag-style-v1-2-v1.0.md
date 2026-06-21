# Claude审查-status-tag-style-v1-2

**审查日期**：2026-06-21
**被审查版本**：status-tag-style-v1-2
**审查者**：Claude Code（只读 Reviewer）
**Base**：main HEAD `ad1648b`，改动在 commit `6e21070`

---

## Summary

- **整体判断**：❌ **不通过**
- **一句话结论**：CSS 重构本身逻辑正确，但 `styles.test.ts` 有 2 个断言未随 CSS 结构调整同步更新，测试回归。修复后可转通过。

---

## Blocking Issue

### B1. `styles.test.ts` 2 个断言未随 CSS 重构更新 🔴

**根因**：CSS 将 `.warning-*` 的 `background` 从通用选择器移到了 `.status-badge.warning-*`（第 1 点设计决策），但测试文件的断言仍匹配旧的通用选择器。

**具体失败**：

[styles.test.ts:19] — `warning-start-delayed` 背景色断言：
```typescript
// 旧（仍在测试中）
expect(styles).toMatch(/\.warning-start-delayed\s*\{[^}]*background:\s*#fff7db.../s);

// CSS 实际结构（6e21070）
.warning-start-delayed {         // ← 无 background
  border-color: #e0b341;
  color: #735500;
}
.status-badge.warning-start-delayed {  // ← background 在这里
  background: #fff7db;
}
```

[styles.test.ts:23] — `warning-overdue` 背景色断言：
```typescript
// 旧（仍在测试中）
expect(styles).toMatch(/\.warning-overdue\s*\{[^}]*background:\s*#fff1ed.../s);

// CSS 实际结构（6e21070）
.warning-overdue {               // ← 无 background
  border-color: #db6b5f;
  color: #8b3f35;
}
.status-badge.warning-overdue {  // ← background 在这里
  background: #fff1ed;
}
```

**修复**：更新 2 个断言匹配新结构：

```typescript
// L18-20 → 改为匹配 .status-badge.warning-start-delayed
it("uses a dedicated visible warning style for delayed-start risks", () => {
  expect(styles).toMatch(/\.status-badge\.warning-start-delayed\s*\{[^}]*background:\s*#fff7db/s);
});

// L22-24 → 改为匹配 .status-badge.warning-overdue
it("keeps overdue warnings on the red-orange palette", () => {
  expect(styles).toMatch(/\.status-badge\.warning-overdue\s*\{[^}]*background:\s*#fff1ed/s);
});
```

同时建议新增 `risk-pill.warning-*` 的 border-color 断言，验证风险条外框变色逻辑。

---

## CSS 重构逻辑审查（除 B1 外均正确）

### 设计决策 1：`.warning-*` 背景拆分 ✅

| 选择器 | 旧 | 新 | 语义 |
|---|---|---|---|
| `.warning-overdue` | `background: #fff1ed` + border + color | `border-color + color` 仅 | 通用色标 |
| `.status-badge.warning-overdue` | 不存在 | `background: #fff1ed` | 状态标签背景 |
| `.risk-pill.warning-overdue` | 不存在 | `border-color: #db6b5f` 仅 | 风险卡片边框 |

**正确性**：
- `background` 从通用选择器移除，避免 `risk-pill` 背景被误染 ✅
- `risk-pill` 保持白色填充（`.risk-pill { background: #fcfdff }`），仅边框变色 ✅
- `status-badge` 通过 `.status-badge.warning-*` 获得背景色 ✅
- 其他未使用或不应受影响的元素不再被误染 `background` ✅

### 设计决策 2：风险条外框颜色分级 ✅

```css
.risk-pill.warning-overdue     { border-color: #db6b5f; }  /* 红 */
.risk-pill.warning-start-delayed { border-color: #e0b341; } /* 黄 */
.risk-pill.warning-early       { border-color: #5fae6b; }  /* 绿 */
```

与仪表盘颜色体系一致 ✅

### `.status-badge` 从药丸到 flex 容器 ✅

```css
.status-badge {              .status-badge > span {
  display: inline-flex;        display: inline-block;
  flex-wrap: wrap;             padding: 2px 6px;
  gap: 2px 4px;                border-radius: 3px;
}                              font-size: 12px;
                               font-weight: 800;
                             }
```

- 旧：实心药丸 `border-radius: 999px; padding: 5px 8px; max-width: 140px`
- 新：透明容器 + 子标签独立着色
- 多标签时每个标签独立背景色，标签间 2-4px 间隙 ✅

### 标签类去边框 ✅

`.tag-early` / `.tag-delayed-start` / `.tag-warning` / `.tag-overdue` / `.tag-neutral` 全部移除了 `border: 1px solid ...`，各色底色无边框——视觉更轻量 ✅

### 表头居中及列宽 ✅

```css
.dashboard-task-table th { text-align: center; white-space: nowrap; }
.col-narrow { width: 56px; }
.col-duration { width: 52px; }
```

- `"编号"` ~26px → 56px 充裕 ✅
- `"计划"` ~26px × 2 行（`<br />`）→ 52px 充裕 ✅
- `white-space: nowrap` 不截断长表头（table auto 布局会自动撑宽） ✅

### 顿号移除 ✅

`RiskTaskStrip` 和 `TaskDetailTable` 都从 `.flatMap` + 顿号改为直接 `.map()`。标签现在通过 `gap` 自然间隔，不再需要文字分隔符。合理 ✅

---

## 审查重点逐项回答

| # | 审查重点 | 分析结果 |
|---|---|---|
| 1 | `.warning-*` 背景拆分影响其他组件 | ✅ 无影响——仅 `.risk-pill` 和 `.status-badge` 使用了 warning 类。其他用法已被通用选择器上的 `border-color` + `color` 覆盖 |
| 2 | `.risk-pill em` 去掉 `color: #8b3f35` 后的回退 | ✅ 安全——进入风险条的任务必有 `riskLabels`（`isRiskTask` 保证），子 `<span>` 自带颜色。空数组不会出现在风险条中 |
| 3 | `.risk-pill span` 的 `display` 冲突 | ✅ 共享选择器 `.risk-pill span, .risk-pill em` 设 `display: inline-flex`，覆盖了可能存在的 `display: block`。同级 + 后出现 = 优先级胜出 |
| 4 | 表头 `white-space: nowrap` 溢出 | ✅ table `auto` 布局 + `th` 无固定宽（除 `col-narrow`/`col-duration`），长文本列自然撑宽 |
| 5 | `col-narrow` 56px / `col-duration` 52px | ✅ 对 12-13px 中文字号足够 |
| 6 | 无关代码改动 | ✅ 严格 4 文件 |

---

## 测试与构建

| 命令 | 结果 |
|---|---|
| `npm test --workspace web` | ❌ **2 failed / 121 passed**（styles.test.ts 两个 CSS 断言失败） |
| `npm run build` | ✅ 通过 |

---

## 结论

❌ **不通过**。CSS 重构逻辑正确、设计合理，但 `styles.test.ts` 的 2 个断言（`.warning-start-delayed` 和 `.warning-overdue` 的背景色）未随 CSS 结构调整同步更新。

**修复**：将 2 个断言的选择器从 `.warning-*` 改为 `.status-badge.warning-*`，匹配新的 CSS 结构。修复后可通过。
