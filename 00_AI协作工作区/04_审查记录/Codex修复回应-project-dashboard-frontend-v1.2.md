# Codex修复回应-project-dashboard-frontend-v1.2

## 输入审查

- 审查文件：`00_AI协作工作区/04_审查记录/Claude审查-project-dashboard-frontend-v1.1.md`
- 审查版本：`project-dashboard-frontend v1.1`
- 处理日期：2026-06-19

## 处理结论

| 审查项 | 分类 | 处理说明 |
| --- | --- | --- |
| B1：时间轴“当前日期”marker 的 CSS `%` 基准与视觉轨道不一致 | 采纳 | 这是时间轴视觉定位正确性问题。已采用 Claude Code 建议的纯 CSS 方案：新增与任务行同网格的 `timeline-today-track`，让 marker 的 `left: <todayPercent>%` 相对任务轨道宽度定位。 |
| B2：`getDashboardStatus` 先查 `elapsedDays` 后查 `actualEndDate`，不一致数据有误判风险 | 采纳 | 这是 CloudBase 数据迁移、手动修补或批量导入场景下的防御性正确性问题。已调整为 `actualEndDate` / `actualStartDate` 优先，`elapsedDays` 仅作为旧数据兼容 fallback。 |
| N1：时间轴 marker 在深色任务条上可见性不足 | 采纳 | 低成本视觉增强，且不改变业务语义。已为 marker 增加白色边框，增强与深色任务条的分离度。 |
| N2：`dashboardMetrics.test.ts` 未通过 service 层集成验证 | 不采纳，后续观察 | 当前 `DashboardPage.test.tsx` 已通过 mocked service 调用真实 `getProjectProgress("2026-06-19")` 并渲染 dashboard，覆盖展示端与服务层的基本集成。后续接 CloudBase 或后台编辑时再补更完整的数据契约测试。 |
| N3：`riskTotal` 未包含 `startDelayedTasks` | 不采纳，保持现设计 | 当前信息架构刻意把“延期/临期”和“延迟启动”拆成两个 KPI，避免把结束日期风险与启动状态混为一个数字；这不属于本次 bug 修复范围。 |

## 已修改内容

- `web/src/features/project/ProjectTimeline.tsx`
  - 新增 `timeline-today-row` / `timeline-today-track` 包裹层。
  - 当前日期 marker 改为在任务轨道列内按 `todayPercent` 定位。
- `web/src/styles.css`
  - 新增当前日期 marker 轨道层样式，使百分比基准与任务条一致。
  - 为 marker 增加白色边框，并保持文本截断，避免小宽度下溢出。
- `web/src/features/project/dashboardMetrics.ts`
  - 调整 `getDashboardStatus` 判定优先级，实际日期优先于 legacy `elapsedDays`。
- `web/src/features/project/dashboardMetrics.test.ts`
  - 新增不一致数据回归测试，验证 `actualEndDate` 优先判为已完成。
- `web/src/features/project/DashboardPage.test.tsx`
  - 新增当前日期 marker 必须定位在 `timeline-today-track` 内的组件测试。
- `00_AI协作工作区/03_版本迭代/VERSION.md`
  - `project-dashboard-frontend` 升级到 `v1.2`。
- `00_AI协作工作区/03_版本迭代/CHANGELOG.md`
  - 新增 `project-dashboard-frontend v1.2` 记录。

## 未修改内容及原因

- 未将“延迟启动”并入“延期/临期”KPI：该项会改变用户看到的 KPI 语义，当前仍保持“结束日期风险”和“启动延迟”分开展示。
- 未新增 CloudBase 数据契约测试：当前 change 仍是前端展示阶段，CloudBase 接入属于后续后台和数据源 change。

## 验证结果

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npm test` | PASS | 6 个测试文件，23 条测试通过 |
| `npm run build` | PASS | `tsc --noEmit && vite build` 成功 |
| `openspec validate project-dashboard-frontend --strict` | PASS | OpenSpec delta 严格校验通过 |
| 浏览器视觉检查：桌面 `1440x900` | PASS | 页面无水平溢出，当前日期 marker 位于任务轨道范围内 |
| 浏览器视觉检查：手机横屏 `844x390` | PASS | 页面无水平溢出，表格/时间轴在自身容器滚动 |
| 浏览器视觉检查：手机竖屏 `390x844` | PASS | 横屏提示显示，完整仪表盘隐藏，无水平溢出 |

## 下一版本

- 版本号：`project-dashboard-frontend v1.2`
- 是否建议再次交给 Claude Code 审查：可选；两条 blocking 已修复，若用户希望保守推进，可让 Claude Code 做一次只读复审后再归档。
