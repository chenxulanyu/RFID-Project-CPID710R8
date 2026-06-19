## Why

项目网站需要从本地/mock 数据走向可持续维护的云端数据源。用户计划使用腾讯云 CloudBase 保存项目内容和进度，因此需要独立定义 CloudBase 数据结构、读写适配和密钥安全边界。

## What Changes

- 设计 CloudBase 数据集合结构，用于保存项目基本信息、任务进度数据和必要的更新时间信息。
- 实现或规划 CloudBase 数据访问适配器，使其符合 `web-app-foundation` 和 `admin-progress-backend` 的数据服务契约。
- 增加环境变量配置说明，确保 CloudBase 环境 ID、密钥和访问配置不写入仓库。
- 增加本地 mock 与 CloudBase 数据源切换策略。
- 增加基础连通性和读写验证方案，待用户提供账号密钥后执行。
- 本 change 不负责前端仪表盘视觉、不负责管理端业务表单、不负责 GitHub/Gitee 推送或扣子部署。

## Capabilities

### New Capabilities
- `cloudbase-project-persistence`: 腾讯云 CloudBase 项目进度持久化能力，包括数据结构、配置、读写适配和安全边界。

### Modified Capabilities
- 无。

## Impact

- 依赖 `web-app-foundation` 的领域模型和 `admin-progress-backend` 的 repository/service 契约。
- 可能新增 CloudBase SDK 依赖、环境变量模板、数据迁移脚本或初始化脚本。
- 涉及云服务凭证处理，必须遵守不提交密钥、不在文档中记录真实密钥的原则。
