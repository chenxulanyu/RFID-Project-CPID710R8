---
comet_change: cloudbase-persistence
role: technical-design
canonical_spec: openspec
---

# CloudBase 持久化技术设计

## 背景

当前网站已经使用 `ProjectRepository` 作为项目元数据和任务进度的读写边界。公开仪表盘和
`/admin` 维护页都通过 service 调用该边界，因此 CloudBase 应作为新的 repository 实现接入，
不应由 React 组件直接调用 CloudBase SDK。

已确认的部署方向是：用户手动部署静态前端，数据存储在腾讯云 CloudBase。本 change 采用
“前端直连 CloudBase Web SDK”方案，以保持当前部署形态简单，不在本轮新增云函数或服务端代理。

## 架构

新增 `CloudBaseProjectRepository`，实现既有 `ProjectRepository` 接口：

- `getProject` 和 `saveProject` 读写一个项目元数据文档。
- `listTaskInputs` 按 `projectId` 查询任务文档；除非传入 `includeArchived`，否则默认排除归档任务。
- `saveTaskInput`、`archiveTask`、`restoreTask` 更新单个任务文档，并保持现有后台 service 行为。

Repository 选择逻辑集中到一个小型工厂中，例如：

- `local` 或配置缺失：使用 `LocalProjectRepository`。
- `cloudbase`：使用 `CloudBaseProjectRepository`。

React 页面继续通过现有 service 使用 repository 契约。任何组件都不应直接 import CloudBase SDK。

## CloudBase Configuration

前端可从 Vite 环境变量读取公开配置：

- `VITE_PROJECT_DATA_SOURCE`: `local` or `cloudbase`.
- `VITE_CLOUDBASE_ENV_ID`: CloudBase environment ID.
- `VITE_CLOUDBASE_ACCESS_KEY`: CloudBase Web SDK 初始化所需的 Publishable Key，如果所选配置要求提供。
- `VITE_CLOUDBASE_PROJECT_ID`: logical project document ID.
- `VITE_CLOUDBASE_PROJECTS_COLLECTION`: default `projects`.
- `VITE_CLOUDBASE_TASKS_COLLECTION`: default `project_tasks`.

前端不得接收或记录 `secretId`、`secretKey` 等服务端密钥。真实配置值只能放在本地 `.env`
或部署平台配置中，不得提交到仓库。

浏览器直连 CloudBase 需要在 CloudBase 控制台允许部署来源，并为选定写入模式配置认证方式和数据库权限规则。
本 change 负责记录该运维要求，但不最终确定生产权限策略。

## 数据模型

使用两个集合：

### `projects`

每个文档保存共享 `Project` 字段和更新时间：

- `_id`: project ID.
- `name`
- `plannedStartDate`
- `plannedEndDate`
- `calendarMode`
- `updatedAt`

### `project_tasks`

每个文档保存一个 `ProjectTaskInput` 和项目关联字段：

- `_id`: task ID.
- `projectId`
- `milestoneCode`
- `projectContent`
- `taskName`
- `plannedStartDate`
- `plannedEndDate`
- `actualStartDate`
- `actualEndDate`
- `resourceOwner`
- `responsiblePerson`
- `remarks`
- `manualCompletionRatio`
- `isArchived`
- `archivedAt`
- `updatedAt`

适配器负责 CloudBase 文档字段和本地 TypeScript 领域模型之间的转换。除非 UI 明确提交空值，
否则可选字段应保持缺省，不应被转换为空字符串。

## 错误与回退行为

如果数据源为 `local`，或必需的 CloudBase 公开配置缺失，应用使用 `LocalProjectRepository`，
保持本地开发、审查和演示可用。

如果数据源明确为 `cloudbase`，但 CloudBase 初始化或请求失败，repository 应把清晰错误交给现有页面级错误处理。
CloudBase 请求失败后不应静默回退到本地数据，否则可能掩盖后台未保存的修改。

## 测试策略

测试不依赖真实 CloudBase 凭证：

- 单元测试覆盖文档到领域模型、领域模型到文档的双向转换。
- 使用 mock CloudBase database/client 测试 repository 读取、写入、归档、恢复和包含归档任务的行为。
- 测试 repository 选择逻辑，包括 local fallback 和 CloudBase 模式。
- 保持现有仪表盘和后台测试通过。
- 运行 `npm test` 和 `npm run build`。

用户提供 CloudBase 环境信息后，再使用非敏感测试数据执行单独的连通性检查，确认读写行为。

## Spec Patch

OpenSpec delta 已补充所选 Web SDK 直连模式和密钥边界：

- 前端直连可使用 CloudBase Web SDK 公开配置和 Publishable Key。
- 前端代码和已提交文档不得使用 `secretId` 或 `secretKey`。
- CloudBase 安全设置说明必须包含允许来源/安全域名、认证方式和数据库权限规则。
