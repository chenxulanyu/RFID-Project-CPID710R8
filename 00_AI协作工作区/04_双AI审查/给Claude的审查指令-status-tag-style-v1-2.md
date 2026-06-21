# Claude Code 审查指令：status-tag-style-v1-2

请作为只读 Reviewer 审查本次状态标签样式优化：去掉状态标签实体框、每个标签独立着色、风险任务外框按严重程度变色、表头居中及列宽调整。

## 改动汇总（4 文件，+91/-40 行）

基于 main 分支 HEAD `ad1648b`，未建独立分支，改动在 working tree。

### 1. RiskTaskStrip.tsx

- 移除顿号 `、` 分隔逻辑，改为直接的 `.map()` 渲染
- 恢复 `.risk-pill` 上的 `warningClass(task)` 类名，使外框按严重程度变色
- 之前误删的 `status-${task.dashboardStatus}` 不再恢复（该类无对应 CSS，是历史残留）

### 2. TaskDetailTable.tsx

- 表头添加 `col-narrow`（编号列）和 `col-duration`（计划工期/实际工期列）类
- 工期表头使用 `<br />` 换行：计划<br />工期、实际<br />工期
- 状态列移除 `status-${task.dashboardStatus}` 和 `warningClass(task)` 类，保留纯 `.status-badge`
- 移除顿号分隔逻辑，改为直接的 `.map()` 渲染
- 缩进风格修正（标准化为空格缩进）

### 3. TaskDetailTable.test.tsx

- 测试中 `textContent` 断言去掉顿号 `、`，匹配新的无分隔渲染

### 4. styles.css

- **`.status-badge`**：从实心药丸（`border-radius: 999px; padding: 5px 8px`）改为透明 flex 容器，子标签各自独立
- **`.status-badge > span`**：统一的子标签样式（`padding: 2px 6px; border-radius: 3px; font-size: 12px; font-weight: 800`）
- **`.tag-early` / `.tag-delayed-start` / `.tag-warning` / `.tag-overdue` / `.tag-neutral`**：全部去掉 `border`，添加 `padding: 2px 6px; border-radius: 3px`，保留各自背景色
- **`.risk-pill span, .risk-pill em`**：添加 `display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px 4px` 使标签并行排列
- **`.risk-pill em`**：从 `color: #8b3f35`（硬编码红色文字）改为 flex 容器，去掉颜色覆盖，让子标签各自着色
- **新增 `.risk-pill.warning-*`**：四个外框颜色变体 — `warning-overdue`（红 #db6b5f）、`warning-start-delayed` / `warning-due-today` / `warning-within-week`（黄 #e0b341）、`warning-early`（绿 #5fae6b）
- **`.warning-overdue` 等类**：`background` 从通用选择器拆出，限制为 `.status-badge.warning-overdue` 才染背景色，确保 `.risk-pill.warning-overdue` 只改 `border-color` 不改背景
- **`.dashboard-task-table th`**：新增 `text-align: center; vertical-align: middle; white-space: nowrap` 使表头居中不换行
- **`.col-narrow`**：`width: 56px` 防止编号列过窄
- **`.col-duration`**：`width: 52px` 防止工期列过窄

## 设计决策

1. `.warning-*` 背景色拆分：原 `.warning-overdue { background: #fff1ed; }` 是通用选择器，会影响所有带该类的元素（包括 `.risk-pill`）。现拆为两段——通用段只保留 `border-color` + `color`，`background` 通过 `.status-badge.warning-overdue` 加回。`.risk-pill.warning-overdue` 只改边框不改背景（保持白色填充），与仪表盘 KPI 卡片风格统一。

2. 风险任务外框颜色分级：红=超期，黄=延迟启动/临期，绿=提前，默认灰=正常。与仪表盘颜色体系对应。

## 验证结果

- `npm run build`（含 `tsc --noEmit`）：通过
- `npx vitest run`：114 测试中 80 通过、34 失败 — 34 个失败均为预存的 jsdom 环境问题（`window is not defined` / `document is not defined`），与此改动无关。改动前后失败数相同。

## 审查重点

1. `.warning-*` 背景色拆分是否可能影响其他未列出的组件使用了 `warning-*` 类并依赖其背景色
2. `.risk-pill em` 去掉 `color: #8b3f35` 后，纯文本回退场景（无 tagClass 子标签时）文字颜色是否正确
3. `.risk-pill span` 的 `display: block` 与联合选择器中 `display: inline-flex` 的优先级冲突是否正确处理
4. 表头 `white-space: nowrap` 是否会导致长列表头溢出被截断
5. `col-narrow` 56px 和 `col-duration` 52px 对中文字号是否足够
6. 是否有改动触及无关代码

## 审查报告

请将审查报告写入 `00_AI协作工作区/04_双AI审查/Claude审查-status-tag-style-v1-2-v1.0.md`，结论标明 通过/有条件通过/不通过。
