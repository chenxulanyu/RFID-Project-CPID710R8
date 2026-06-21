# Claude审查-dashboard-and-timeline-v1-1（终审）

**审查日期**：2026-06-21
**被审查版本**：dashboard-and-timeline v1.1
**审查者**：Claude Code（只读 Reviewer）
**分支**：`codex/dashboard-and-timeline-v1-1`

---

## Summary

- **整体判断**：❌ **不通过**
- **一句话结论**：存在致命 bug——`projectService.ts` 的 `hasRequiredTaskFields` 仍要求 `resourceOwner` 和 `responsiblePerson` 非空，与需求 5 的非必填改动不一致，导致用户新增不填资源方/责任人的任务后，仪表盘数据被种子数据替换。

---

## 🔴 Critical：仪表盘不显示新任务

### 根因

需求 5 将 `resourceOwner` 和 `responsiblePerson` 改为非必填，修改了两处：

1. ✅ `projectValidation.ts` — 移除 `requireText` 校验
2. ✅ `cloudbaseProjectRepository.ts` — `hasRequiredTaskDocumentFields` 移除两者检查

**但漏了第三处**：[projectService.ts:43-53](web/src/services/projectService.ts#L43-L53)

```typescript
function hasRequiredTaskFields(task: ProjectTaskInput): boolean {
  return Boolean(
    task.id &&
      task.milestoneCode &&
      task.projectContent &&
      task.taskName &&
      task.plannedStartDate &&
      task.plannedEndDate &&
      task.resourceOwner &&      // ❌ 仍要求非空！
      task.responsiblePerson,    // ❌ 仍要求非空！
  );
}
```

### 影响链

`projectService.ts` 是**仪表盘的数据通道**（非后台维护的数据通道）：

```
DashboardPage → getProjectProgress() → selectTaskInputs()
                                                  ↓
                              taskInputs.every(hasRequiredTaskFields)
                                                  ↓
                              任何一个任务 resourceOwner/responsiblePerson 为空
                                                  ↓
                              → 整个列表判定为无效 → 回退种子数据 cpid710r8TaskInputs
```

**后果**：用户在后台新增任务（不填资源方/责任人）→ CloudBase 存入成功 → 后台维护页面正常显示 → **切换到仪表盘 → `selectTaskInputs` 发现有一条任务缺 resourceOwner → `every` 返回 false → 全部用户数据被种子数据替换** → 看起来"没有变化"，实际是显示了旧种子数据。

### 修复

[projectService.ts:43-53](web/src/services/projectService.ts#L43-L53)：移除 `resourceOwner` 和 `responsiblePerson` 的必填检查：

```typescript
function hasRequiredTaskFields(task: ProjectTaskInput): boolean {
  return Boolean(
    task.id &&
      task.milestoneCode &&
      task.projectContent &&
      task.taskName &&
      task.plannedStartDate &&
      task.plannedEndDate,
  );
}
```

---

## 🟡 项目信息与任务详情间距过大

### 排查结果

对比 v1.0（`cbafd8b`）和当前代码：

| 维度 | v1.0 | 当前 | 差异 |
|---|---|---|---|
| HTML 结构 | 两个 `section.admin-panel.admin-section` 在 `div.admin-panels` 内 | 完全一致 | 无 |
| `.admin-panels` CSS | `display: grid; gap: 16px;` | 完全一致 | 无 |
| `.admin-section + .admin-section` | `margin-top: 18px; padding-top: 18px;` | 完全一致 | 无 |
| `.admin-panel` padding | `16px` | 完全一致 | 无 |

**v1.1 代码没有改动任何影响间距的 HTML 或 CSS。** 如果部署后看到间距异常，可能原因：

1. **浏览器缓存**：旧 CSS 被缓存，新 JS 加载后 DOM 结构变了但 CSS 未更新
2. **部署未完成**：扣子部署有延迟，CSS/JS 版本不一致

**建议**：修复 Critical bug 后重新部署，强制刷新（Ctrl+Shift+R）验证间距。如果间距仍异常，再截图排查。

---

## 问题分析：为什么这个版本出现这么多问题

根本原因是**需求 5（资源方/责任人非必填）的改动只改了"写入通道"，漏改了"读取通道"**。

项目中存在两条独立的数据通道：

```
写入通道（后台维护）：
  AdminPage → projectAdminService → projectValidation + cloudbaseProjectRepository
                                    ↑ 已修改（移除必填检查）  ↑ 已修改（移除字段检查）

读取通道（仪表盘）：
  DashboardPage → projectService → hasRequiredTaskFields
                                    ↑ 未修改！仍要求非空
```

Codex 只关注了后台维护的写入路径，没有搜索所有使用 `resourceOwner` / `responsiblePerson` 的代码位置，导致读取路径的校验未被同步更新。

**教训**：当修改字段的"必填性"这种跨切面属性时，必须全局搜索所有引用该字段的校验逻辑，而非只修改当前需求的直接上下文。

---

## 历史问题复核

| 问题 | 状态 |
|---|---|
| B1 actual widthPercent off-by-one | ✅ 已修复 |
| B2 自动扩展不持久化 | ✅ 已修复 |
| M1 `void saveProjectMetadata` 失败静默 | ✅ 已修复 |
| C3 CSS 死代码残留 | ✅ 已修复 |
| **P1 仪表盘不显示新任务** | ❌ **未修复 — 阻塞** |
| P2 项目信息间距过大 | ⚠️ 代码无差异，需重新部署验证 |

---

## 结论

**❌ 不通过。** P1 是致命 bug——`projectService.ts` 的 `hasRequiredTaskFields` 需同步移除 `resourceOwner` 和 `responsiblePerson` 的必填检查。修复后重新部署验证。
