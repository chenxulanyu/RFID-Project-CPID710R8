# Claude Code 审查指令：risk-pill-table-align-v1-2

请作为只读 Reviewer 审查本次两项 UI 调整：风险任务卡片均分铺满 + 任务明细部分列居中及责任人换行。

## 改动汇总（3 文件，+23/-14 行）

基于 main 分支 HEAD `f5fa792`。

### 1. RiskTaskStrip.tsx

- "N 项需关注"从独立的 `<div className="section-heading-row">` 中移出，改为 `<h2>` 内的内联 `<span>`，作为标题后缀提示

### 2. TaskDetailTable.tsx

- **部分列加 `col-center` 类**：编号（`<td>`）、计划工期（`<th>` + `<td>`）、实际工期（`<th>` + `<td>`）、状态（`<th>` + `<td>`）、责任人（`<th>` + `<td>`）
- **责任人列**：`/` 分隔改为按行换行渲染。单个名字不额外空行，多个名字用 `<br />` 分隔

### 3. styles.css

- **`.risk-pill`**：`flex: 0 0 220px`（固定宽度）改为 `flex: 1 1 calc(25% - 10px); max-width: calc(25% - 10px); min-width: 180px`，实现每排 4 个均分铺满外框，窄屏自动换行
- **新增 `.col-center`**：`text-align: center !important; vertical-align: middle;`

## 设计决策

1. 风险任务 25% 均分：`gap: 10px` 的 `risk-list` flex 容器中，每个卡片 `calc(25% - 10px)` 确保 4 列铺满。`!important` 仅用于 `col-center` 覆盖 `.task-table td { text-align: left }`，不涉及风险卡片。
2. 责任人换行：`"周伟松/唐凯"` → 两行显示，比斜线更易读，也避免单元格过宽。

## 验证

- `npm run build`（含 `tsc --noEmit`）：通过

## 审查重点

1. `.risk-pill` 的 `calc(25% - 10px)` 在 gap 为 10px 时是否正确（4 × (25% - 10px) + 3 × 10px = 100% - 10px，会略窄 10px 吗？实际是 flex 均分，gap 在 flex 中会被浏览器自动处理）
2. `col-center` 的 `!important` 是否必要，是否会影响其他列的样式
3. 责任人换行时 `key` 是否有冲突风险（`br` 用 `br-${i}` key）
4. RiskTaskStrip 标题结构从 `<div>` 包 `<h2>` 改为 `<h2>` 直接包 `<span>` 是否影响可访问性或语义
5. 是否有改动触及无关代码

## 审查报告

请将审查报告写入 `00_AI协作工作区/04_双AI审查/Claude审查-risk-pill-table-align-v1-2-v1.0.md`，结论标明 通过/有条件通过/不通过。
