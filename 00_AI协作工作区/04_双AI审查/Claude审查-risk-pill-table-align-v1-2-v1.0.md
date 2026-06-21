# Claude审查-risk-pill-table-align-v1-2

**审查日期**：2026-06-21
**被审查版本**：risk-pill-table-align-v1-2
**审查者**：Claude Code（只读 Reviewer）
**Base**：`f5fa792` → HEAD `828c076`

---

## Summary

- **整体判断**：❌ **不通过**
- **一句话结论**：风险卡片均分布局、责任人换行、col-center 定位均正确，但 `RiskTaskStrip` 标题 DOM 重构导致 `<h2>` 丢失 `font-size: 18px` 样式——规则 `.section-heading-row h2`（后代选择器）不再匹配，因为 `<h2>` 现在是 `.section-heading-row` 本身而非后代。

---

## Blocking Issue

### B1. `<h2>` 将 `section-heading-row` 从父容器改为自身，丢失字体样式 🔴

[RiskTaskStrip.tsx:15](web/src/features/project/RiskTaskStrip.tsx#L15)

**改动前**（`<div>` 包裹 `<h2>`）：
```html
<div className="section-heading-row">
  <h2 id="risk-strip-title">风险任务</h2>     <!-- 记在 div 内，后代选择器匹配 -->
  <span>N 项需关注</span>
</div>
```

**改动后**（`<h2>` 自身承载 `section-heading-row`）：
```html
<h2 className="section-heading-row" id="risk-strip-title" style={{ justifyContent: "flex-start" }}>
  风险任务                                   <!-- h2 自身是 section-heading-row，后代选择器不匹配 -->
  <span>N 项需关注</span>
</h2>
```

**CSS 规则**（[styles.css:176-179](web/src/styles.css#L176-L179)）：
```css
.section-heading-row h2 {   /* 后代选择器：.section-heading-row 内部的 h2 */
  font-size: 18px;
  margin: 0;
}
```

该规则匹配 `<div.section-heading-row> → <h2>`（旧结构），但**不匹配** `<h2.section-heading-row>`（新结构）。结果 `<h2>` 回退到浏览器默认样式（≈24px bold + 默认 margin），与页面所有其他区域标题（18px）不一致。

**对比验证**：

| 位置 | DOM 结构 | `.section-heading-row h2` 匹配？ | 渲染字号 |
|---|---|---|---|
| 仪表盘"计划时间轴" | `<div.section-heading-row><h2>` | ✅ 匹配 | 18px |
| 仪表盘"任务明细" | `<div.section-heading-row><h2>` | ✅ 匹配 | 18px |
| **风险任务（本改动）** | `<h2.section-heading-row>` | ❌ 不匹配 | **≈24px（浏览器默认）** |
| 后台维护"项目信息" | `<div.section-heading-row><h2>` | ✅ 匹配 | 18px |

**修复建议**（二选一）：

方案 A — 最小 CSS 修复：
```css
/* styles.css L176-179 → 增加 h2.section-heading-row */
.section-heading-row h2,
h2.section-heading-row {
  font-size: 18px;
  margin: 0;
}
```

方案 B — 回退 DOM 结构，保持 `<div>` 包裹 `<h2>`。

---

## 其余审查 ✅（除 B1 外均正确）

### 1. 风险卡片均分布局 ✅

```css
flex: 1 1 calc(25% - 10px);
max-width: calc(25% - 10px);
min-width: 180px;
```

| 配置 | 作用 |
|---|---|
| `flex-grow: 1` | 剩余空间均分填充 |
| `flex-basis: calc(25% - 10px)` | 4 列基准宽度 |
| `max-width: calc(25% - 10px)` | 上限防止单卡过宽 |
| `min-width: 180px` | 下限防止文字溢出 |

`gap: 10px` 的容器中，4 × `(25%-10px)` + 3 × `10px` = `100% - 10px`。右侧约 10px 空隙被 `flex-grow: 1` 分配到各卡片，每卡微增，视觉不可察觉。窄屏 `min-width: 180px` 触发自动换行，卡片不挤压 ✅

### 2. `col-center` 的 `!important` ✅

```css
.col-center {
  text-align: center !important;
  vertical-align: middle;
}
```

`.task-table td { text-align: left }`（特异度 0,2,1）会覆盖 `.col-center { text-align: center }`（特异度 0,1,0）。`!important` 是必需的——且仅作用于显式添加 `col-center` 的单元格，不影响其他列 ✅

### 3. 责任人换行 key 无冲突 ✅

```tsx
{task.responsiblePerson.split("/").flatMap((name, i, arr) =>
  i < arr.length - 1
    ? [<span key={i}>{name}</span>, <br key={`br-${i}`} />]
    : [<span key={i}>{name}</span>]
)}
```

- `<span>` 用 `{i}` 作 key，`<br>` 用 `br-${i}` → 无冲突 ✅
- 不同任务行（不同 `<tr>`）的 key 独立作用域，不冲突 ✅
- `"周伟松"`（单个名字）：`arr.length = 1`，不进入 `i < 0` 分支 → 仅 `<span>` 无 `<br>` ✅
- `"周伟松/唐凯"`（两个名字）：`span[0]` + `br[0]` + `span[1]` ✅

### 4. 范围控制 ✅

严格 3 文件（RiskTaskStrip.tsx、TaskDetailTable.tsx、styles.css），未触及 CloudBase、部署配置、其他组件 ✅

---

## 测试与构建

| 命令 | 结果 |
|---|---|
| `npm run build` | ✅ 通过 |

（本次改动未新增测试，B1 属视觉回归需在浏览器验证）

---

## 结论

❌ **不通过**。B1 阻塞——`RiskTaskStrip` 标题 DOM 重构破坏 `.section-heading-row h2` 的字体样式匹配，`<h2>` 渲染为浏览器默认 ≈24px 而非预期的 18px。

**修复**：在 `styles.css` L176 增加 `h2.section-heading-row` 选择器（1 行 CSS），或回退 DOM 结构。修复后可通过。
