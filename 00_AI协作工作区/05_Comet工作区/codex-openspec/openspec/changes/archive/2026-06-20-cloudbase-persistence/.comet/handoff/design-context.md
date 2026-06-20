# Comet Design Handoff

- Change: cloudbase-persistence
- Phase: design
- Mode: compact
- Context hash: cea080d9ab7031f0e9b734eda32b752b2105d126fcf383fa5e4fbf64e4a1f77c

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/cloudbase-persistence/proposal.md

- Source: openspec/changes/cloudbase-persistence/proposal.md
- Lines: 1-26
- SHA256: 7b683924dc10312774872118b18af3b34dc9598885fd7d17c689f78e0ee620cd

```md
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
```

## openspec/changes/cloudbase-persistence/design.md

- Source: openspec/changes/cloudbase-persistence/design.md
- Lines: 1-47
- SHA256: 12d5fb1354a06e5d95e803870d2ccbf3a6cd401d12e30c1885cc5e052cb4961c

```md
## Context

项目网站最终需要由用户维护数据并存储在腾讯云 CloudBase。当前基础工程和后台维护能力可以先基于 mock/local repository 运转，但进入真实协作和部署前，需要 CloudBase 作为统一持久化来源。

用户后续才会提供 CloudBase 账号、密钥和环境信息；这些凭证不得写入仓库、OpenSpec 文档或普通版本记录。

## Goals / Non-Goals

**Goals:**
- 定义 CloudBase 数据集合和文档结构，使其能保存项目和任务进度数据。
- 提供 CloudBase repository 适配器，实现与既有服务契约兼容的读写。
- 提供环境变量和部署配置说明，避免密钥硬编码。
- 支持从 mock/local 数据切换到 CloudBase 数据源。

**Non-Goals:**
- 不在文档或代码中记录真实账号密钥。
- 不实现前端展示组件或后台表单。
- 不执行最终生产部署。
- 不决定复杂权限策略，除非用户后续确认 CloudBase 访问模式。

## Decisions

1. **CloudBase 作为 repository 实现，而不是直接侵入业务组件**
   - 选择：CloudBase 适配器实现后台服务约定的读写接口。
   - 理由：展示端和管理端不用关心存储细节。
   - 替代方案：组件直接调用 CloudBase SDK。该方案耦合高，也增加凭证暴露风险。

2. **数据集合以项目和任务为核心**
   - 选择：至少包含项目元数据集合和任务集合，任务通过项目 ID 关联。
   - 理由：便于后续支持任务查询、更新和潜在多项目扩展。
   - 替代方案：单文档保存全部项目数据。该方案简单，但任务级更新和查询不够灵活。

3. **凭证只通过环境变量或部署平台密钥配置注入**
   - 选择：使用 `.env.example` 或部署说明记录变量名，不记录真实值。
   - 理由：符合安全边界，也方便 GitHub/Gitee 公开或半公开仓库管理。
   - 替代方案：本地配置文件保存真实值。该方案容易误提交。

4. **保留 mock fallback**
   - 选择：CloudBase 配置缺失时应用仍可使用 mock/local 数据。
   - 理由：开发、审查和演示不应被云凭证阻塞。

## Risks / Trade-offs

- [Risk] CloudBase 权限模型未确认 → Mitigation: 在实现前等待用户确认访问方式，首版只设计适配边界。
- [Risk] 云端数据结构与本地模型漂移 → Mitigation: 使用领域模型作为 schema 来源，并添加读写转换测试。
- [Risk] 密钥误提交 → Mitigation: 只提交 `.env.example`，真实 `.env` 加入忽略规则并在文档中警示。
- [Risk] 网络或云服务不可用影响展示 → Mitigation: 保留 mock/local fallback 或错误提示策略。
```

## openspec/changes/cloudbase-persistence/tasks.md

- Source: openspec/changes/cloudbase-persistence/tasks.md
- Lines: 1-23
- SHA256: 84dfc2c89d206bd852cc2eaa1b42055337263122b6d11a1f3b728e0d3460b27e

```md
## 1. CloudBase Schema

- [ ] 1.1 Define CloudBase collections for project metadata and task progress records.
- [ ] 1.2 Map the shared project progress model to CloudBase document fields.
- [ ] 1.3 Document required indexes or query patterns for reading project tasks.

## 2. Configuration Safety

- [ ] 2.1 Add placeholder environment variable documentation for CloudBase environment and credential configuration.
- [ ] 2.2 Ensure real CloudBase credentials are excluded from committed files.
- [ ] 2.3 Add runtime behavior for missing CloudBase configuration.

## 3. Repository Adapter

- [ ] 3.1 Implement a CloudBase repository adapter compatible with the project progress service contract.
- [ ] 3.2 Add data source switching between mock/local and CloudBase modes.
- [ ] 3.3 Verify adapter transformations preserve project and task fields.

## 4. Cloud Verification

- [ ] 4.1 Prepare a connectivity verification command or documented check.
- [ ] 4.2 After user provides credentials, verify CloudBase read access.
- [ ] 4.3 After user provides credentials, verify CloudBase write/update access with non-sensitive test data.
```

## openspec/changes/cloudbase-persistence/specs/cloudbase-project-persistence/spec.md

- Source: openspec/changes/cloudbase-persistence/specs/cloudbase-project-persistence/spec.md
- Lines: 1-48
- SHA256: 78cf86ab005f8dd6618e00a0bfe021dcab01b11f3cc049aab3788fed0a43b1bb

```md
## ADDED Requirements

### Requirement: CloudBase data schema
The system SHALL define CloudBase data structures for project metadata and project task progress records that preserve the shared project progress data contract.

#### Scenario: Store project task in CloudBase
- **WHEN** a project task is saved to CloudBase
- **THEN** its identity, project association, schedule, progress, owner, warning-relevant fields, and remarks can be restored into the shared project progress model

### Requirement: CloudBase repository adapter
The system SHALL provide a CloudBase-backed repository adapter that supports reading project data and writing administrative updates through the existing service contract.

#### Scenario: Read project data from CloudBase
- **WHEN** CloudBase configuration is present and the frontend or backend requests project data
- **THEN** the system reads project metadata and task records from CloudBase through the repository adapter

### Requirement: Secret-safe configuration
The system SHALL configure CloudBase credentials through environment variables or deployment secrets and MUST NOT commit real credentials to the repository or planning artifacts.

#### Scenario: Prepare repository for sharing
- **WHEN** the project is prepared for GitHub or Gitee
- **THEN** only placeholder configuration names and examples are present, with no real CloudBase secret values

#### Scenario: Use frontend direct CloudBase access
- **WHEN** the frontend is configured to access CloudBase directly through the Web SDK
- **THEN** it may use public Web SDK configuration such as environment ID, collection names, project ID, and Publishable Key
- **AND** it MUST NOT use or document service-side secrets such as `secretId` or `secretKey`

### Requirement: CloudBase browser access safety
The system SHALL document the CloudBase browser access safety prerequisites required for frontend direct access.

#### Scenario: Prepare CloudBase for deployed frontend access
- **WHEN** the website is configured to use the CloudBase Web SDK from a deployed browser origin
- **THEN** the setup guidance identifies the need for allowed origins or security domains, authentication mode, and database permission rules before enabling write access

### Requirement: Local fallback behavior
The system SHALL keep local or mock data usable when CloudBase configuration is absent, unless the runtime is explicitly configured to require CloudBase.

#### Scenario: Run without CloudBase credentials
- **WHEN** a developer starts the project without CloudBase environment variables
- **THEN** the application can still load local or mock project data for development and review

### Requirement: CloudBase connectivity verification
The system SHALL include a verification path for confirming CloudBase read and write connectivity once the user provides credentials.

#### Scenario: Verify cloud persistence
- **WHEN** valid CloudBase credentials and environment configuration are provided
- **THEN** a verification command or documented check confirms that project data can be read and updated
```

