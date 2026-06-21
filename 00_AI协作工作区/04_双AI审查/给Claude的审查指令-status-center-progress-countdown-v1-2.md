# Claude Code 审查指令：status-center-progress-countdown-v1-2

请作为只读 Reviewer 审查本次三项小调整：状态列居中修复、进度条 100% 深绿、未开始倒计时去"距"字。

## 改动汇总（3 文件，+10/-2 行）

### 1. TaskDetailTable.tsx

- 进度条 `<span>` 根据 `completionRatio >= 1` 动态添加 `progress-complete` 类名

### 2. dashboardMetrics.ts

- `getNotStartedCountdownLabel` 返回 `距X天` → `X天`，去掉"距"前缀

### 3. styles.css

- 新增 `td.col-center .status-badge { justify-content: center; }` 修复状态列内联 flex 标签不居中问题（`text-align` 对 `inline-flex` 无效）
- 新增 `.progress-track span.progress-complete { background: #2d7d46; }` 深绿色覆盖蓝色

## 验证

- `npm run build`（含 `tsc --noEmit`）：通过

## 审查重点

1. `td.col-center .status-badge` 的 `justify-content: center` 是否会影响其他非表格场景的 `.status-badge`
2. `completionRatio >= 1` 的边界条件是否正确（ratio 可能因浮点数略大于 1？）
3. 去"距"字后的倒计时标签 "未开始（9天）" 是否仍然语义清晰
4. 是否有改动触及无关代码

## 审查报告

请将审查报告写入 `00_AI协作工作区/04_双AI审查/Claude审查-status-center-progress-countdown-v1-2-v1.0.md`，结论标明 通过/有条件通过/不通过。
