# Claude审查-archive-gap-fix-v1.0

**审查日期**：2026-06-20
**被审查版本**：归档列表间隔空隙修复
**审查者**：Claude Code（只读 Reviewer）
**提交**：`aac2fc0`

---

## Summary

- **整体判断**：✅ **通过**
- **一句话结论**：修复正确且最小——`taskVisible` 的 `archived` 分支增加 `Boolean(task.taskName)` 过滤，与 `active` 分支对称，消除 CloudBase 残留空数据导致的列表空 `<li>` 占位。

---

## 修复内容

[AdminPage.tsx:30](web/src/features/project/AdminPage.tsx#L30)

```diff
  function taskVisible(task: ProjectTaskInput, filter: TaskFilter) {
-   if (filter === "archived") return Boolean(task.isArchived);
+   if (filter === "archived") return Boolean(task.isArchived) && Boolean(task.taskName);
    return !task.isArchived && Boolean(task.taskName);
  }
```

---

## 逻辑正确性

### 修复前两分支对比

| 分支 | 过滤条件 | 是否过滤空 taskName |
|---|---|---|
| `active`（L31） | `!task.isArchived && Boolean(task.taskName)` | ✅ 是 |
| `archived`（L30） | `Boolean(task.isArchived)` | ❌ 否 |

`active` 分支已有 `Boolean(task.taskName)` 守卫，`archived` 分支缺失——这是对称性漏洞。

### 修复后

| 分支 | 过滤条件 | 是否过滤空 taskName |
|---|---|---|
| `archived`（L30） | `Boolean(task.isArchived) && Boolean(task.taskName)` | ✅ 是 |
| `active`（L31） | `!task.isArchived && Boolean(task.taskName)` | ✅ 是 |

两分支现在对称，语义一致：**仅显示有名称的任务**。

---

## 根因分析

CloudBase 中存在 `isArchived: true` 但 `taskName` 为空（`""` 或 `null`/`undefined`）的残留记录。修复前 `archived` 分支不过滤这些记录，导致：

1. `visibleTasks` 包含空名称条目
2. 列表渲染 `<li>` 元素，但 `<strong>{task.taskName}</strong>` 为空
3. 产生视觉上的间隔空隙

### `Boolean(task.taskName)` 的覆盖范围

| `taskName` 值 | `Boolean()` 结果 | 是否显示 |
|---|---|---|
| `"设计评审"` | `true` | ✅ 显示 |
| `""` | `false` | ❌ 过滤 |
| `null` | `false` | ❌ 过滤 |
| `undefined` | `false` | ❌ 过滤 |

覆盖了所有空值场景 ✅

---

## 影响范围

- **仅改一行**，无副作用
- `taskVisible` 仅在两处调用：
  - [L92](web/src/features/project/AdminPage.tsx#L92)：`tasks.filter((task) => taskVisible(task, filter))` — 构建可见列表
  - [L111](web/src/features/project/AdminPage.tsx#L111)：`data.tasks.find((task) => taskVisible(task, nextFilter))` — 切换筛选时定位首条可见任务
- 两处调用均受益于更严格的过滤，不会误排除有效任务（有效任务必有 `taskName`）

### 不影响数据层

此修复仅在 UI 渲染层过滤，不删除或修改 CloudBase 中的残留数据。空 `taskName` 的记录仍在数据库中，只是不显示在列表中。这是合理的防御策略——避免显示损坏数据，但不丢失原始记录。

---

## 潜在关注点

### 空数据的来源

CloudBase 中 `isArchived: true` 且 `taskName` 为空的记录本身是异常数据。此修复是**展示层防御**，建议后续排查空数据的产生路径（可能是归档前的校验遗漏，或历史数据迁移问题），从源头防止空记录写入。

此为非阻塞性建议，不影响本次修复的通过判定。

---

## 测试与构建

| 命令 | 结果 |
|---|---|
| `npm test --workspace web` | ✅ **80/80 通过**（13 文件，1.49s） |
| `npm run build --workspace web` | ✅ 通过（152ms） |

---

## 结论

修复正确、最小、无副作用。`taskVisible` 两分支现在对称过滤空 `taskName`，消除归档列表的间隔空隙问题。✅ 通过。

**后续建议**：排查 CloudBase 空 `taskName` 残留数据的产生路径，考虑在写入层增加校验。
