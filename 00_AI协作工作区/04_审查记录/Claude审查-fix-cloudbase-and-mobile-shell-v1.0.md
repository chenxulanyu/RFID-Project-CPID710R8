# Claude审查-fix-cloudbase-and-mobile-shell-v1.0

**审查日期**：2026-06-20
**被审查版本**：`fix-cloudbase-and-mobile-shell v1.0`
**审查者**：Claude Code（只读 Reviewer）
**分支**：`main`（提交 `9287d1d`）

---

## Summary

- **整体判断**：**通过**
- **一句话结论**：用户反馈的 3 个线上问题全部正确修复——生产默认 CloudBase 配置、localStorage 旧快照升级、CloudBase 数据合并基线、移动端导航旋转范围。55 条测试全部通过，扣子部署文件未被修改，无安全密钥泄露。**可以进入归档阶段。**

---

## 逐问题修复验证

### 问题 1：多设备数据同步 → ✅ 已修复

**根因**：`VITE_PROJECT_DATA_SOURCE` 未显式设置时静默回退 `local`。

**修复** [projectRepositoryFactory.ts:31-52](web/src/services/projectRepositoryFactory.ts#L31-L52)：

```typescript
// v1.0 (有bug): 未设置时 fallback local
if (env.VITE_PROJECT_DATA_SOURCE !== "cloudbase") return { source: "local" };

// v1.0 (修复后): 只有显式 local 才 local，默认 cloudbase
if (env.VITE_PROJECT_DATA_SOURCE === "local") return { source: "local" };
// 否则走 CloudBase 默认配置
```

| 场景 | v1.0 行为 | v1.0 (fix) 行为 |
|---|---|---|
| 扣子未设 `VITE_PROJECT_DATA_SOURCE` | `local`（仅当前设备） | `cloudbase`（多设备同步）✅ |
| 测试环境 `VITE_PROJECT_DATA_SOURCE=local` | `local`（正确） | `local`（不变）✅ |
| 显式设为 `cloudbase` | `cloudbase` | `cloudbase`（不变）✅ |
| 含 `VITE_CLOUDBASE_SECRET_ID` | crash（安全拒绝） | crash（不变）✅ |

**默认 CloudBase 配置**（硬编码在代码中）：
- `defaultCloudBaseEnvId`: `"webtest-d1g5ir6tl69366b35"`
- `defaultCloudBaseAccessKey`: PublishableKey JWT（`"platform": "PublishableKey"`, `"sub": "anon"`, `"scope": "anonymous"`）

经验证，该 accessKey 是 **CloudBase Publishable Key**（匿名访问、非管理员、明确标记 `"platform":"PublishableKey"`），符合前端直连安全模型。不是 `secretId/secretKey`。✅

**注意**：PublishableKey 硬编码意味着如果 CloudBase 控制台轮换该 key，代码需要同步更新。建议后续将默认值迁移到 `.env.example` 或部署平台环境变量中，当前作为首发版本可接受。

---

### 问题 2：移动端导航不旋转 → ✅ 已修复

**根因**：`LandscapeGate` 包裹在 `AdminPage` / `DashboardPage` 内部，`App` 的 `<nav>` 在旋转容器外。

**修复**：
- [App.tsx:12-21](web/src/app/App.tsx#L12-L21)：`LandscapeGate` 上移到 `App`，包裹 `<main>`（含 `<nav>` 和路由页面）
- `AdminPage.tsx` 和 `DashboardPage.tsx`：移除重复的 `LandscapeGate` 包裹
- `LandscapeGate`：简化为纯旋转壳（`.landscape-shell` > `.landscape-content`）

**DOM 结构**：
```
<LandscapeGate>
  <div class="landscape-shell">
    <div class="landscape-content">     ← CSS transform: rotate(90deg) 在此
      <main class="app-shell">
        <nav class="top-nav">...</nav>  ← 现在在旋转容器内 ✅
        <DashboardPage />               ← 一起旋转 ✅
      </main>
    </div>
  </div>
</LandscapeGate>
```

---

### 问题 3：PC 端刷新仍显示 3 条旧任务 → ✅ 已修复

**这是双重修复**：

#### 3a. localStorage 旧快照升级 [projectRepository.ts:56-77](web/src/services/projectRepository.ts#L56-L77)

`isLegacySeedSnapshot` 检测旧 3 条种子快照（4 个条件同时满足）：
1. 同一 `project.id`
2. 新种子 ≥ 20 个唯一里程碑
3. 快照里程碑数 < 种子里程碑数
4. 快照中所有任务 ID 都在种子中（即没有用户自定义任务）

检测到后，`upgradeStoredSnapshot` 执行合并升级——31 条种子为基线 + 同 ID 的本地覆盖。

| 快照场景 | `isLegacySeedSnapshot` | 行为 |
|---|---|---|
| 旧 3 条（M1/M5/M6） | `true` | 升级为 31 条 + 本地覆盖 ✅ |
| 含自定义任务 ID | `false` | 保留原数据 ✅ |
| 已升级到 31 条 | `false`（20 < 20） | 不重复升级 ✅ |
| 空快照 | null | 使用全新种子 ✅ |

#### 3b. CloudBase 数据合并 [cloudbaseProjectRepository.ts:135-141](web/src/services/cloudbaseProjectRepository.ts#L135-L141)

`listTaskInputs` 新逻辑：
1. 过滤掉缺必填字段的无效 CloudBase 文档（`hasRequiredTaskDocumentFields`）
2. 映射为 `ProjectTaskInput`
3. **以 31 条种子为基线**，用 `mergeTaskInputs` 合并 CloudBase 中间 ID 覆盖 + 新任务
4. 最后按 `includeArchived` 过滤归档

**合并行为**：
- 种子中的任务 ID → CloudBase 有同 ID → **CloudBase 覆盖**（保留后台修改）✅
- 种子中的任务 ID → CloudBase 无同 ID → **保留种子** ✅
- CloudBase 中有但种子中无 → **追加为自定义任务** ✅
- 归档任务（`isArchived: true`）→ 默认被 `filter` 排除，后台可用 `includeArchived: true` 读取 ✅

---

## 非目标检查

### 安全：无服务端密钥进入前端 ✅

| 检查项 | 结果 |
|---|---|
| `VITE_CLOUDBASE_SECRET_ID` / `VITE_CLOUDBASE_SECRET_KEY` 运行时拒绝 | ✅ L32-34 |
| 默认 `accessKey` 为 PublishableKey（非 secret） | ✅ JWT payload 标记 `"platform":"PublishableKey"` |
| 无真实 `secretId`/`secretKey` 写入代码或文档 | ✅ |

### 扣子部署文件未被修改 ✅

```bash
$ git diff -- .coze package.json package-lock.json serve.mjs web/tsconfig.json docs/deployment.md
（无输出）
```

### 后台 CRUD 行为不受影响 ✅

| 操作 | 行为 |
|---|---|
| 新增任务 | `saveTaskInput` → 写入 CloudBase/localStorage，`mergeTaskInputs` 中种子无此 ID → 作为自定义任追加 ✅ |
| 更新任务 | 同 ID 覆盖种子字段 ✅ |
| 归档任务 | `isArchived: true` 写入，公开读取自动排除 ✅ |
| 恢复任务 | `isArchived: false`，公开读取重新可见 ✅ |

---

## Test and Command Results

| 命令 | 结果 | 说明 |
|---|---|---|
| `npm test` | ✅ **55/55 通过** | 10 测试文件，1.36s（+4 新增测试） |
| `npm run build` | ✅ **通过** | chunk 警告属已知（CloudBase SDK） |
| `git diff --check` | ✅ 无空白问题 | |
| `git diff -- .coze package.json ...` | ✅ **空输出** | 扣子文件 0 变更 |
| 独立验证（Node.js） | ✅ **全部通过** | 默认配置、旧快照识别、合并逻辑、归档保护 |

### 新增/更新测试

| 测试 | 变更 |
|---|---|
| `projectService.test.ts` "loads CPID710R8...data" | 扩展：验证 31 条明细、M1-M20 全里程碑、M5 三项、首尾任务 |
| `projectService.test.ts` "falls back to complete default task seed" | **新增**：CloudBase 返回无效数据时回退到 31 条种子 |
| `projectService.test.ts` 期望值 | 更新 `toHaveLength(31)`，移除旧 3 条硬编码期望 |

---

## 版本记录

| 检查项 | 状态 |
|---|---|
| `VERSION.md`: `fix-cloudbase-and-mobile-shell: v1.0` | ✅ |
| `CHANGELOG.md`: v1.0 条目覆盖全部 4 项修复 | ✅ |
| `tasks.md` 5/5 全部勾选 | ✅ |

---

## 结论

`fix-cloudbase-and-mobile-shell v1.0` **通过审查**。

- 问题 1（多设备）：生产默认 CloudBase + `local` 显式回退 → ✅
- 问题 2（导航旋转）：`LandscapeGate` 上移 `App` → ✅
- 问题 3（旧数据覆盖）：localStorage 升级 + CloudBase 合并基线 → ✅
- 55 条测试通过、构建通过、扣子文件 0 变更、无安全密钥泄露

无 Blocking Issue。**可以进入归档阶段。**

### 关于上次审查的遗漏

我在 `seed-full-project-tasks` 审查中把这 3 个问题的根因都接触到了，但做出了错误的严重级别判断：
- 问题 1 的 `local ↔ cloudbase` 行为差异没有显式标为部署风险
- 问题 2 的 CSS `transform` 没有在真实视口中做视觉验证
- 问题 3 的 `selectTaskInputs` 把 "旧数据不触发回退" 误判为设计意图

本轮修复全部覆盖了这些遗漏点。建议后续审查中，涉及 CSS transform 布局和跨设备数据同步的变更，强制要求视觉截图或多设备实测验证。
