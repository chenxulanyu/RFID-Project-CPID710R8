# Claude审查-fix-project-save-and-timeline-axis-v1.0

**审查日期**：2026-06-20
**被审查版本**：`fix-project-save-and-timeline-axis v1.0`
**审查者**：Claude Code（只读 Reviewer）
**分支**：`main`（提交 `d36f0b6`）

---

## Summary

- **整体判断**：**通过**
- **一句话结论**：CloudBase 项目保存修复采用 5 次回读重试 + 120ms 间隔 + `updated: 0` 检测，正确覆盖了副本延迟和静默写入失败两种场景。AdminPage 按钮布局符合需求。甘特图精简为仅显示百分比。70 条测试全部通过。**可以归档。**

---

## 逐项审查

### 1. CloudBase 项目保存修复 ✅

三重防护 [cloudbaseProjectRepository.ts:151-267](web/src/services/cloudbaseProjectRepository.ts)：

#### 1a. `assertWriteSucceeded` 增加 `updated: 0` 检测

[L170-172](web/src/services/cloudbaseProjectRepository.ts#L170-L172)：
```typescript
if (result && typeof result === "object" && "updated" in result && result.updated === 0) {
    throw new Error("CloudBase保存失败：没有记录被更新，请检查集合写权限或文档归属");
}
```

| CloudBase 返回 | 修复前 | 修复后 |
|---|---|---|
| `{ updated: 1 }` | 静默通过 | 静默通过 ✅ |
| `{ updated: 0 }` | **静默通过** ❌ | **throw "没有记录被更新"** ✅ |
| `{ code: "PERMISSION_DENIED" }` | throw | throw ✅ |

**不会掩盖真实写入失败**：`updated: 0` 和 `code: "..."` 错误走各自明确的错误消息，不会混淆。

#### 1b. 有限重试 + 延迟

[L35-36](web/src/services/cloudbaseProjectRepository.ts#L35-L36)：
```typescript
const projectReadbackAttempts = 5;
const projectReadbackDelayMs = 120;
```

[L204-212](web/src/services/cloudbaseProjectRepository.ts#L204-L212)：`for` 循环最多 5 次回读，每次间隔 120ms。

| 特性 | 修复前 | 修复后 |
|---|---|---|
| 重试次数 | 2 次（硬编码） | **5 次** ✅ |
| 重试间隔 | **0ms** ❌ | **120ms** ✅ |
| 总等待上限 | 0ms | 480ms（4 次间隔） |
| 循环结构 | 两个独立 await | `for` 循环，清晰 ✅ |

**5×120ms 是合理值**：CloudBase 副本同步通常在 100-500ms 内完成。5 次间隔覆盖 480ms 窗口，足以穿越大多数最终一致延迟。不会无限阻塞。

#### 1c. `sleep` 辅助函数

[L72-76](web/src/services/cloudbaseProjectRepository.ts#L72-L76)：`new Promise(resolve => setTimeout(resolve, ms))`，仅在上一次回读失败且还有剩余尝试次数时才 sleep，不会在成功时引入不必要延迟。✅

#### 测试覆盖

| 测试 | 覆盖场景 |
|---|---|
| `retries a transient project readback mismatch` [test:212-272](web/src/services/cloudbaseProjectRepository.test.ts) | 第 1 次读返回错误 `plannedStartDate`，第 2 次正确 → 重试成功 |
| `accepts project save readback when CloudBase returns only the document _id` [test:274-320](web/src/services/cloudbaseProjectRepository.test.ts) | CloudBase 文档不含 `id` 字段只有 `_id` → 归一化比对通过 |
| `reports a permission-oriented error when CloudBase updates no existing document` [test:322-335](web/src/services/cloudbaseProjectRepository.test.ts) | `update()` 返回 `{ updated: 0 }` → throw 权限提示 |

---

### 2. AdminPage 按钮布局 ✅

#### 2a. 项目信息区 [AdminPage.tsx:270-274](web/src/features/project/AdminPage.tsx#L270-L274)

```tsx
<div className="admin-actions admin-actions-left">
    <button onClick={handleProjectSave}>保存项目信息</button>
</div>
```

- `admin-actions-left` → `justify-content: flex-start` → 按钮靠左 ✅
- 保存按钮在项目信息框底部左下角 ✅

#### 2b. 任务详情区 [AdminPage.tsx:339-353](web/src/features/project/AdminPage.tsx#L339-L353)

```tsx
<div className="admin-actions admin-actions-left">
    <button onClick={handleTaskSave}>保存任务信息</button>    {/* 第 1 */}
    <button onClick={handleArchive}>归档任务</button>          {/* 第 2 */}
    <button onClick={handleRestore}>恢复任务</button>         {/* 第 3 */}
</div>
```

- 保存按钮在**归档/恢复之前** ✅
- `justify-content: flex-start` → 三按钮从左排列 ✅
- 项目编辑守卫 (`projectEditEnabled` checkbox) 未变 ✅

#### 2c. CSS [styles.css:595-603](web/src/styles.css)

```css
.admin-section .admin-actions { justify-content: flex-end; }  /* 默认右对齐 */
.admin-section .admin-actions-left { justify-content: flex-start; }  /* 覆盖为左对齐 */
```

---

### 3. 甘特图精简 ✅

#### 3a. 移除的元素

| 移除的元素 | 证据 |
|---|---|
| `timeline-date-start` / `timeline-date-end` spans | [ProjectTimeline.tsx:33](web/src/features/project/ProjectTimeline.tsx#L33) 仅剩 `<span className="timeline-percent">` |
| `timeline-today-row` / `timeline-today-track` / `timeline-today` div | [ProjectTimeline.tsx:14-17](web/src/features/project/ProjectTimeline.tsx#L14-L17) 无此结构 |
| 黑色当前日期竖线 marker | 整个 `timeline-today` 移除 ✅ |

#### 3b. 保留的元素

| 保留的元素 | 位置 |
|---|---|
| 当前日期文本 | `timeline-axis` 中 `<strong>当前日期：{model.today}</strong>` ✅ L16 |
| 百分比标签 | 条形内居中 `<span className="timeline-percent">` ✅ L33 |
| 条形颜色语义 | `status-finished/in-progress/start-delayed/not-started` + `warning-overdue` ✅ |

#### 3c. 条形布局简化

```css
/* 修复前: grid 三栏 */
display: grid;
grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
min-width: 164px;

/* 修复后: flex 居中 */
display: flex;
justify-content: center;
min-width: 56px;
```

- `min-width: 56px` 对窄条更友好（之前 164px 会撑大窄条）
- `justify-content: center` 百分比始终居中显示 ✅

#### 3d. 时间轴线简化

```css
.timeline-axis {
    display: flex;          /* 之前是 grid 三栏 */
    justify-content: center;
    padding-left: 232px;    /* 对齐任务轨道的左边缘 */
}
```

只保留当前日期文本（居中显示），移除了起始/结束日期标签。✅

**测试覆盖** [ProjectTimeline.test.tsx](web/src/features/project/ProjectTimeline.test.tsx)：更新为验证百分比标签在条形内。`DashboardPage.test.tsx` 移除了旧的 `timeline-today` marker 样式断言。✅

---

## Test and Command Results

| 命令 | 结果 |
|---|---|
| `npm test` | ✅ **70/70 通过**（13 文件，1.46s，+5 新增） |
| `npm run build` | ✅ 通过 |

### 新增测试

| 测试 | 覆盖 |
|---|---|
| `reports a permission-oriented error when updated: 0` | `assertWriteSucceeded` 检测 `updated: 0` |
| `accepts project save readback when only _id` | 归一化比对忽略 `id` 字段缺失 |
| `retries a transient project readback mismatch` | 重试 + 延迟机制 |

---

## 版本记录

| 检查项 | 状态 |
|---|---|
| `VERSION.md` | ✅ `fix-project-save-and-timeline-axis: v1.0` |
| `CHANGELOG.md` | ✅ 已记录 |
| `tasks.md` | ✅ 全部勾选 |

---

## 结论

`fix-project-save-and-timeline-axis v1.0` **通过审查**。

- CloudBase 保存修复：5 次重试 + 120ms 间隔 + `updated: 0` 检测 → 完整覆盖副本延迟和静默写入失败 ✅
- AdminPage 按钮布局：项目保存左下角、任务保存左对齐且在归档/恢复前 ✅
- 甘特图精简：仅保留百分比 + 当前日期文本，移除日期标签和黑色 marker ✅
- 70 条测试通过 ✅

**可以归档。**
