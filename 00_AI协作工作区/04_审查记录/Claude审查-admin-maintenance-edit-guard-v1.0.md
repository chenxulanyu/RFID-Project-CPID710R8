# Claude审查-admin-maintenance-edit-guard-v1.0

**审查日期**：2026-06-20
**被审查版本**：`admin-maintenance-edit-guard v1.0`
**审查者**：Claude Code（只读 Reviewer）
**分支**：`main`（提交 `d602ac9`）

---

## Summary

- **整体判断**：**通过**
- **一句话结论**：`saveDocument` 用 get-then-update-or-set 策略正确修复了 E11000 duplicate key 问题；项目字段默认锁定 + checkbox 确认机制正确；项目/任务独立保存按钮合理；归档/恢复路径不变。61 条测试通过。0 个 Blocking Issue。**可以归档。**

---

## 逐项审查

### 1. CloudBase `saveDocument`：get → update/set，修复 duplicate key ✅

**根因**：上一版本 `saveProject`/`saveTaskInput` 对已有文档也调用 `set()`，CloudBase 将 `set()` 视为 insert，导致 `E11000 duplicate key error collection: projects index: _id_ dup key`。

**修复** [cloudbaseProjectRepository.ts:142-152](web/src/services/cloudbaseProjectRepository.ts#L142-L152)：

```typescript
private async saveDocument(collectionName, id, document) {
  const existing = await reference.get();
  if (existing文档存在) {
    await reference.update(document);   // 更新已有文档
  } else {
    await reference.set(document);      // 新增文档
  }
}
```

| 场景 | `get()` 结果 | 写入方式 | 结果 |
|---|---|---|---|
| 首次部署，文档不存在 | `null` | `set()` | ✅ 新增 |
| 后续保存，文档已存在 | `{ ... }` | `update()` | ✅ 更新（不触发 duplicate key） |
| 新增任务（新 ID） | `null` | `set()` | ✅ 新增 |
| 更新任务（旧 ID） | `{ ... }` | `update()` | ✅ 更新 |

**测试覆盖** [cloudbaseProjectRepository.test.ts:212-268](web/src/services/cloudbaseProjectRepository.test.ts#L212-L268)：
- `UpdateOnlyCollection`：`set()` 抛 E11000 duplicate key，`update()` 正常工作
- 验证已有文档时 `saveProject`/`saveTaskInput` 走 `update` 路径成功 ✅

---

### 2. 项目区默认锁定 + checkbox 确认 ✅

**实现** [AdminPage.tsx:74,233-239](web/src/features/project/AdminPage.tsx#L74)：

- `projectEditEnabled` 初始 `false`
- 项目字段 `disabled={!projectEditEnabled}`
- checkbox "确认修改项目信息" 切换 `projectEditEnabled`
- `reload()` 后重置为 `false`

**测试覆盖** [AdminPage.test.tsx:10-23](web/src/features/project/AdminPage.test.tsx#L10-L23)：验证默认 disabled、勾选后 enabled ✅

---

### 3. 项目/任务独立保存按钮 ✅

| 按钮 | 触发函数 | 行为 |
|---|---|---|
| "保存项目信息" | `handleProjectSave` | `saveProjectMetadata` → `reload` → 消息 "项目信息已保存" |
| "保存任务信息" | `handleTaskSave` | `createProjectTask`/`updateProjectTask` → `reload` → 消息 "任务信息已保存" |
| "归档任务" | `handleArchive` | 独立，不触发项目/任务保存 |
| "恢复任务" | `handleRestore` | 独立，不触发项目/任务保存 |

**测试覆盖** [AdminPage.test.tsx:25-43](web/src/features/project/AdminPage.test.tsx#L25-L43)：独立保存项目和任务 ✅

---

### 4. 归档/恢复任务正常 ✅

| 操作 | 路径 | 验证 |
|---|---|---|
| 归档 | `archiveTask` → `saveTaskInput({ isArchived: true, archivedAt })` → `saveDocument` | ✅ 测试通过 |
| 恢复 | `restoreTask` → destructure `archivedAt` → `saveTaskInput({ isArchived: false })` | ✅ `archivedAt` 清除 |
| CloudBase 序列化 | `taskToCloudBaseDocument` 中 `archivedAt: task.archivedAt ?? null` | ✅ 显式 null |

恢复任务后 `archivedAt` 被 destructure 移除 + `isArchived: false`，CloudBase 文档中 `archivedAt` 字段显式设为 `null` 覆盖旧值。✅

---

### 5. 版本记录 ✅

| 检查项 | 状态 |
|---|---|
| `VERSION.md` | ✅ `admin-maintenance-edit-guard: v1.0` |
| `CHANGELOG.md` | ✅ 已记录 |
| `tasks.md` 全部勾选 | ✅ |

---

## Minor

### M1. `handleTaskSave` 中 dead ternary

- **文件**：[AdminPage.tsx:140](web/src/features/project/AdminPage.tsx#L140)
- **证据**：`setMessage(isNewTask ? "任务信息已保存" : "任务信息已保存")`
- **影响**：无功能影响，两个分支返回相同字符串
- **建议**：简化为 `setMessage("任务信息已保存")`

---

## Test and Command Results

| 命令 | 结果 | 说明 |
|---|---|---|
| `npm test` | ✅ **61/61 通过** | 13 测试文件，1.49s（+4 新增） |
| `npm run build` | ✅ **通过** | chunk 警告属已知 |
| 独立验证（Node.js） | ✅ 全部通过 | saveDocument 策略、archivedAt 清理、锁定机制、独立保存 |

### 新增/更新测试

| 测试 | 覆盖 |
|---|---|
| "locks project metadata until editing is confirmed" | 项目字段默认 disabled → checkbox 解锁 |
| "saves project metadata independently from task details" | 独立项目保存 |
| "saves task details independently from project metadata" | 独立任务保存 |
| "updates existing project and task documents instead of inserting duplicates" | `saveDocument` get→update 路径、E11000 防御 |

---

## 结论

`admin-maintenance-edit-guard v1.0` **通过审查**。

- `saveDocument` 策略正确解决 duplicate key ✅
- 项目锁定 + checkbox 确认机制正确 ✅
- 项目/任务独立保存合理 ✅
- 归档/恢复路径不变且正常 ✅
- 61 条测试通过 ✅
- M1 为极低优先级代码风格问题，不阻塞

**可以归档。**
