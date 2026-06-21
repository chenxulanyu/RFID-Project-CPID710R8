# Claude审查-fix-admin-active-list-height-v1.0

**审查日期**：2026-06-21
**被审查版本**：fix-admin-active-list-height
**审查者**：Claude Code（只读 Reviewer）
**分支**：`hotfix/20260621/fix-admin-active-list-height`

---

## Summary

- **整体判断**：✅ **通过**
- **一句话结论**：采用 JS 测量右侧 `.admin-panels` 实际高度并锁定左侧 panel 高度的方案，正确实现"左侧外框高度 = 右侧总高度、切换不变化、内部滚动"三项要求。CSS 守卫（`min-height: 0` + `overflow: hidden`）防止测量反馈环。范围控制严格。1 个 Minor 关于移动端单列布局。

---

## 方案理解

```
.admin-layout (grid, align-items: stretch)
  ├─ aside.admin-panel (左, 任务列表)  ← JS 锁定 height = 右侧测量值
  │     ├─ .section-heading-row
  │     ├─ .admin-actions
  │     └─ .admin-task-list (flex:1, overflow:auto)  ← 内部滚动
  └─ div.admin-panels (右, ref 测量基准)
        ├─ 项目信息 section
        └─ 任务详情 section
```

- `useLayoutEffect` 读取 `adminPanelsRef.current.getBoundingClientRect().height` → `setTaskPanelHeight`
- 左侧 `<aside>` 通过 inline `style={{ height, maxHeight }}` 锁定
- `.admin-layout > .admin-panel` 新增 `overflow: hidden`，配合已有 `min-height: 0` 防止内容撑高

---

## 逐项审查

### 1. 右侧实际高度作为左侧基准 ✅

[AdminPage.tsx:104-107](web/src/features/project/AdminPage.tsx#L104-L107)

```typescript
const syncTaskPanelHeight = useCallback(() => {
  const nextHeight = adminPanelsRef.current?.getBoundingClientRect().height ?? 0;
  setTaskPanelHeight(nextHeight > 0 ? Math.round(nextHeight) : null);
}, []);
```

- `adminPanelsRef` 绑定到 `.admin-panels`（右侧容器）✅
- 测量右侧实际渲染高度作为左侧基准 ✅
- [AdminPage.tsx:311](web/src/features/project/AdminPage.tsx#L311) `<div className="admin-panels" ref={adminPanelsRef}>` ✅
- [AdminPage.tsx:261](web/src/features/project/AdminPage.tsx#L261) 左侧 `<aside style={taskPanelHeight ? { height, maxHeight } : undefined}>` ✅

### 2. 切换活跃/已归档时左侧外框高度不变 ✅

**关键分析**：左侧高度 = 右侧测量高度。右侧 `.admin-panels` 内容 = 项目信息 + 任务详情，**不依赖任务列表筛选**（任务详情显示 selectedTask，与列表 filter 无关）。因此切换 filter 时右侧高度不变 → 左侧锁定值不变 ✅

[AdminPage.tsx:109-111](web/src/features/project/AdminPage.tsx#L109-L111) `useLayoutEffect` 依赖包含 `filter`，切换时会重新测量并重设相同值，确保同步 ✅

测试 [AdminPage.test.tsx:83-107](web/src/features/project/AdminPage.test.tsx#L83-L107)：
- mock `getBoundingClientRect` 对 `.admin-panels` 返回固定 720
- 渲染后断言左侧 `height: "720px"`、`maxHeight: "720px"`
- 点击"已归档"后再次断言仍为 `"720px"` ✅

### 3. 活跃任务过多时内部滚动 ✅

[styles.css:467-473](web/src/styles.css#L467-L473)

```css
.admin-layout > .admin-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;  /* 新增 */
}
```

- `overflow: hidden` + `min-height: 0`：左侧 panel 内容不撑高 panel，超出部分裁剪 ✅
- `.admin-task-list` 已有 `flex: 1` + `overflow: auto`：列表占满剩余空间并内部滚动 ✅
- inline `height/maxHeight` 锁定 panel 高度 → flex 列可用空间固定 → 列表滚动而非撑高 ✅

#### 测量反馈环分析（重点）

潜在担忧：左侧 inline height 是否影响右侧测量值，形成 H_n = measure(right(H_{n-1})) 的循环。

**收敛性证明**：
- 左侧 `min-height: 0` + `overflow: hidden` 使左侧内容**不参与 grid 行高计算**
- 首次渲染（无 inline height）：grid 行高 = 右侧自然内容高度 R_natural。左侧 `height: 100%` = R_natural
- `useLayoutEffect`（paint 前同步执行）测量右侧 = R_natural，设 H = R_natural
- 后续：grid 行高 = max(H, R_natural) = R_natural（因 H = R_natural）。右侧 stretch 到 R_natural。测量稳定 = R_natural ✅

CSS 守卫确保左侧永不膨胀 grid 行，测量值始终反映右侧自然高度，无发散风险 ✅

### 4. 范围控制 ✅

| 不应修改 | 状态 |
|---|---|
| CloudBase 持久化 | ✅ 未触及 |
| 任务保存/归档/删除逻辑 | ✅ 未触及 |
| 部署配置 | ✅ 未触及 |
| seed 数据 | ✅ 未触及 |
| dashboardMetrics / services / App | ✅ 未触及 |

改动严格限于 4 个文件 + 审查报告：
- `AdminPage.tsx` + `.test.tsx`：高度测量逻辑
- `styles.css` + `styles.test.ts`：`overflow: hidden` 一行

### 5. 测试覆盖 ✅

| 需求 | 测试 | 文件 |
|---|---|---|
| 右侧高度测量为左侧基准 | "locks the task-list panel height to the right-side maintenance panels" | AdminPage.test.tsx |
| 切换 filter 高度不变 | 同测试中点击"已归档"后断言 | AdminPage.test.tsx |
| 内部滚动约束 | "lets the admin task panel stretch... list scrolls internally" | styles.test.ts |
| panel overflow: hidden | 同上断言 | styles.test.ts |

测试用 `vi.spyOn(getBoundingClientRect)` mock 右侧高度，验证 JS 接线正确。jsdom 无真实布局，无法验证反馈环，但 CSS 守卫已从结构上保证 ✅

---

## Minor Issues

### Minor 1. 移动端单列布局同样应用 JS 高度锁

[AdminPage.tsx:261](web/src/features/project/AdminPage.tsx#L261) inline `height` 无媒体查询守卫，移动端（≤760px，`.admin-layout` 变 `grid-template-columns: 1fr` 单列堆叠）时左侧 panel 仍被锁定为右侧高度。

桌面并排布局下这是期望行为；但移动端堆叠布局下，任务列表被强制为右侧总高度可能不符合预期（通常希望自然高度或视口约束）。

**影响**：低。移动端有 LandscapeGate 强制横屏，且 `.admin-task-list` 内部仍可滚动，不会破坏功能。仅视觉上可能偏高。

**建议**：如需优化，可在 `syncTaskPanelHeight` 中检测 `window.matchMedia("(max-width: 760px)")`，单列时返回 null 不锁定。非阻塞。

### Minor 2. `useLayoutEffect` 依赖无法捕获所有右侧高度变化

[AdminPage.tsx:109-111](web/src/features/project/AdminPage.tsx#L109-L111) 依赖列表覆盖 `project/selectedTask/filter/projectEditEnabled/isNewTask/tasks.length`，但字体异步加载、动态内容等非状态驱动的高度变化不会触发重测。`resize` 监听仅覆盖视口变化。

**影响**：低。首次布局在 paint 前同步测量，主要场景已覆盖。仅极端边缘（字体延迟加载）可能短暂错位。

---

## 测试与构建

| 命令 | 结果 |
|---|---|
| `npm test --workspace web -- AdminPage.test.tsx styles.test.ts` | ✅ 14/14 通过 |
| `npm test --workspace web` | ✅ **91/91 通过**（14 文件，1.50s） |
| `npm run build --workspace web` | ✅ 通过 |
| `openspec validate fix-admin-active-list-height --strict` | ✅ 通过 |
| `openspec validate --specs --strict` | ✅ 7/7 通过 |

---

## 结论

✅ **通过**。三项要求全部正确实现：

- 左侧 panel 高度 = 右侧 `.admin-panels` 实际测量高度（`getBoundingClientRect`）
- 切换活跃/已归档时右侧高度不变（内容不依赖 filter）→ 左侧锁定值不变
- 活跃任务过多时 `overflow: hidden` + `flex:1` + `overflow:auto` 保证内部滚动，不撑高外框

CSS 守卫（`min-height: 0` + `overflow: hidden`）从结构上消除测量反馈环风险。无 Blocking 或 Important 问题。2 个 Minor（移动端高度锁、依赖覆盖边缘）非阻塞。
