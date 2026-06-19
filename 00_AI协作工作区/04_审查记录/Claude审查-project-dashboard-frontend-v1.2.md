# Claude审查-project-dashboard-frontend-v1.2（复审）

**审查日期**：2026-06-19
**被审查版本**：`project-dashboard-frontend v1.2`
**审查者**：Claude Code（只读 Reviewer）
**分支**：`feature/20260619/project-dashboard-frontend`
**前次审查**：[Claude审查-project-dashboard-frontend-v1.1.md](Claude审查-project-dashboard-frontend-v1.1.md)

---

## Summary

- **整体判断**：**通过**
- **一句话结论**：v1.1 的两个 Blocking Issue（B1 时间轴 marker CSS `%` 基准、B2 `getDashboardStatus` 优先级）均已正确修复，N1（marker 可见性）也一并修正。23 条测试通过、构建成功、OpenSpec 严格校验通过。**project-dashboard-frontend v1.2 可以进入归档阶段。**

---

## 逐项修复验证

### B1：时间轴 marker CSS `%` 基准 ✅ 已修复

| 检查项 | 状态 |
|---|---|
| 新增 `timeline-today-row` 包裹层，`grid-template-columns: 220px 1fr` 与任务行同网格 | ✅ [ProjectTimeline.tsx:23](web/src/features/project/ProjectTimeline.tsx#L23) |
| 新增 `timeline-today-track`，`grid-column: 2` + `position: relative` | ✅ [ProjectTimeline.tsx:24](web/src/features/project/ProjectTimeline.tsx#L24) |
| 去掉 `calc(232px + ...)` 混合单位 | ✅ |
| `.timeline-today` 的 `left: <todayPercent>%` 基准为 track 宽度 | ✅ [ProjectTimeline.tsx:25](web/src/features/project/ProjectTimeline.tsx#L25) |
| `transform: translateX(-50%)` 将 marker 中心对齐日期点 | ✅ [styles.css:355](web/src/styles.css#L355) |
| 测试：marker 必须在 `timeline-today-track` 内 | ✅ [DashboardPage.test.tsx:57-61](web/src/features/project/DashboardPage.test.tsx#L57-L61) |

**CSS 结构验证**：

```
.timeline-frame (position: relative)
├── .timeline-axis
├── .timeline-today-row (position: absolute, grid: 220px 1fr)
│   └── .timeline-today-track (grid-column: 2, position: relative)
│       └── .timeline-today (position: absolute, left: 49.73%)
├── .timeline-row (grid: 220px 1fr)
│   └── .timeline-track (grid-column: 2, position: relative)
│       └── .timeline-bar (position: absolute, left: 36.61%)
```

`.timeline-today-track` 和 `.timeline-track` 位于同一 `grid-column: 2`，共享相同的 `1fr` 宽度。marker 的 `49.73%` 和 bar 的 `36.61%` 基于同一宽度基准。**视觉偏移问题已消除。** ✅

---

### B2：`getDashboardStatus` 优先级 ✅ 已修复

| 检查项 | 状态 |
|---|---|
| `actualEndDate` 判定移至 L47（最高优先级） | ✅ [dashboardMetrics.ts:47](web/src/features/project/dashboardMetrics.ts#L47) |
| `actualStartDate` 判定移至 L48 | ✅ [dashboardMetrics.ts:48](web/src/features/project/dashboardMetrics.ts#L48) |
| `elapsedDays` 作为兼容 fallback 保留在 L49-50 | ✅ [dashboardMetrics.ts:49-50](web/src/features/project/dashboardMetrics.ts#L49-L50) |
| 新增不一致数据回归测试 | ✅ [dashboardMetrics.test.ts:163-181](web/src/features/project/dashboardMetrics.test.ts#L163-L181) |

**独立验证 8 个场景**：

| 场景 | v1.2 结果 | v1.1 结果 | 判断 |
|---|---|---|---|
| 正常已完成 (actualEndDate) | finished | finished | ✅ 无回归 |
| 正常进行中 (actualStartDate) | in-progress | in-progress | ✅ 无回归 |
| **冲突数据 (actualEndDate + elapsedDays=10)** | **finished** | **in-progress** ❌ | ✅ 修复 |
| **冲突数据 (actualEndDate + elapsedDays=5)** | **finished** | **in-progress** ❌ | ✅ 修复 |
| 旧数据兼容: 仅 elapsedDays finished | finished | finished | ✅ 兼容保留 |
| 旧数据兼容: 仅 elapsedDays 数字 | in-progress | in-progress | ✅ 兼容保留 |
| 延迟启动 | start-delayed | start-delayed | ✅ 无回归 |
| 未来未开始 | not-started | not-started | ✅ 无回归 |

**B2 0/8 场景有回归，2/8 场景从错误修复为正确。** ✅

---

### N1：marker 可见性 ✅ 已修复

- `.timeline-today` 新增 `border: 2px solid #ffffff` + `box-sizing: border-box`
- 白色边框在深色任务条（`#c4473c` / `#6b7a90` / `#17202a`）上提供清晰的分离边界 ✅

---

### N2/N3 不采纳评估

| 审查项 | Codex 决定 | 评估 |
|---|---|---|
| N2: dashboardMetrics.test 未通过 service 集成 | 不采纳，`DashboardPage.test.tsx` 已覆盖 mocked service + 真实 `getProjectProgress("2026-06-19")` | ✅ 理由充分，展示端集成链已在组件测试中验证 |
| N3: riskTotal 不含 startDelayed | 不采纳，刻意分开"日期风险"和"启动延迟"两个 KPI | ✅ 信息架构设计决策，不属于 bug |

---

## 溢出与视口复查

### 桌面 1440×900

- `.dashboard-page max-width: 1320px` + `margin: 0 auto` → 居中，无页面级溢出 ✅
- KPI 6 列 `minmax(120px, 1fr)`：1320px 下每列 220px ✅
- 时间轴 `min-width: 1040px` < 1320px → 无横向滚动 ✅
- 任务表 `min-width: 1060px` < 1320px → 无横向滚动 ✅

### 手机横屏 844×390

- `@media (max-width: 1100px)` 触发：KPI 6→3 列，每列 `minmax(120px, 1fr)` ✅
- `@media (max-width: 760px)` 触发：padding 收紧、KPI 3→2 列、section-heading 列布局 ✅
- 时间轴 `min-width: 1040px` > 844px → `.timeline-scroll { overflow-x: auto }` 容器内滚动 ✅
- 任务表 `min-width: 1060px` > 844px → `.table-scroll { overflow-x: auto }` 容器内滚动 ✅

### 手机竖屏 390×844

- `@media (max-width: 760px) and (orientation: portrait)` 触发：
  - `.landscape-content { display: none }` → 仪表盘隐藏 ✅
  - `.landscape-gate { display: grid }` → 横屏引导显示 ✅
- 引导文案：h1 28px `overflow-wrap: anywhere`，p `max-width: 320px` `overflow-wrap: anywhere` → 无溢出 ✅
- 竖屏下仅显示引导，无表格/时间轴渲染 → 无重叠风险 ✅

### 文字/框体溢出控制总结

| 区域 | 约束手段 | 结果 |
|---|---|---|
| KPI 标题 | `overflow-wrap: anywhere` | ✅ |
| KPI 数字 | `font-size: 30px`, 自然截断 | ✅ |
| 风险 pill | `flex: 0 0 220px`, `text-overflow: ellipsis` | ✅ |
| 表格单元格 | `max-width: 220px`, `overflow-wrap: anywhere` | ✅ |
| 状态 badge | `max-width: 140px`, `text-overflow: ellipsis` | ✅ |
| 时间轴 label | `text-overflow: ellipsis`, `white-space: nowrap` | ✅ |
| 时间轴 bar 文字 | `overflow: hidden`, `text-overflow: ellipsis` | ✅ |
| 横屏引导 h1 | `overflow-wrap: anywhere` | ✅ |
| 横屏引导 p | `max-width: 320px`, `overflow-wrap: anywhere` | ✅ |

---

## Test and Command Results

| 命令 | 结果 | 说明 |
|---|---|---|
| `npm test` | ✅ **23/23 通过** | 6 测试文件，715ms（v1.1: 22 条） |
| `npm run build` | ✅ **通过** | `tsc --noEmit && vite build`，62ms |
| `openspec validate project-dashboard-frontend --strict` | ✅ **通过** | Change is valid |
| 独立边界验证（Node.js） | ✅ **全部通过** | B1 CSS 基准、B2 8 场景全矩阵 |
| 密钥泄露扫描 | ✅ 通过 | 无新增 |

### 测试增量（v1.1 → v1.2）

| 文件 | 新增测试 | 覆盖内容 |
|---|---|---|
| `dashboardMetrics.test.ts` | +1 | 不一致数据下 actualEndDate 权威优先 |
| `DashboardPage.test.tsx` | 修改 | marker 定位改为验证 `timeline-today-track` 容器内位置 |

---

## 版本记录

| 检查项 | 状态 |
|---|---|
| `VERSION.md`: `project-dashboard-frontend: v1.2` | ✅ |
| `CHANGELOG.md`: 新增 v1.2 条目 | ✅ |
| 修复回应文档 | ✅ [Codex修复回应-project-dashboard-frontend-v1.2.md](Codex修复回应-project-dashboard-frontend-v1.2.md) |
| 提交信息 `fix: address claude dashboard review findings` | ✅ |

---

## 结论

`project-dashboard-frontend v1.2` **通过复审**。

- B1（时间轴 marker CSS `%` 基准）：采用纯 CSS 方案，`timeline-today-track` 与任务轨道列对齐 → 已修复
- B2（`getDashboardStatus` 优先级）：`actualEndDate`/`actualStartDate` 优先，`elapsedDays` 仅作 fallback → 已修复
- N1（marker 可见性）：白色边框 → 已修复
- N2/N3：不采纳理由充分，分别有组件测试覆盖和分卡设计的明确意图

**无新增 Blocking Issue。project-dashboard-frontend v1.2 可以进入归档阶段。**
