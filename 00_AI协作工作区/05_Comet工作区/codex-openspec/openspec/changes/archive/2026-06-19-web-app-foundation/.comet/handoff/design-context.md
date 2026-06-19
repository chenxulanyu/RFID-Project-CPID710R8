# Comet Design Handoff

- Change: web-app-foundation
- Phase: design
- Mode: compact
- Context hash: 009a7d1f836741a7eaf11382aa4b2c84bec53a832da08db14363eb72555b5703

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/web-app-foundation/proposal.md

- Source: openspec/changes/web-app-foundation/proposal.md
- Lines: 1-26
- SHA256: 0f64542379ef27906c8fce63d9a6f594b86b9e929ab7e05412139a02215080fc

```md
## Why

现有 `CPID710R8_项目进度管理.xlsx` 已具备项目进度跟踪、预警和甘特图能力，但它仍是单机 Excel 文件，不利于后续前后端网站化、云端持久化和移动端展示。先建立网站工程基础，可以把 Excel 中已经验证过的数据结构沉淀为可扩展的数据模型，为展示端、管理端、CloudBase 持久化和部署工作提供共同底座。

## What Changes

- 创建项目网站的基础工程结构，包含前端应用入口、路由、基础布局和本地开发启动方式。
- 建立项目进度管理的核心领域模型，覆盖项目、里程碑/任务、计划日期、实际日期、完成比例、预警、责任人、资源方和备注。
- 提供从当前 Excel 内容抽象出的首版 mock 数据，用于无云密钥条件下的前后端开发和验收。
- 建立数据访问抽象层，使后续可以从 mock 数据平滑切换到管理端接口和 CloudBase。
- 明确本 change 只负责基础骨架，不实现完整仪表盘、不实现后台维护功能、不接入真实 CloudBase、不处理 GitHub/Gitee 推送和扣子部署。

## Capabilities

### New Capabilities
- `project-web-foundation`: 网站基础工程、项目进度数据模型、mock 数据源和数据访问抽象。

### Modified Capabilities
- 无。

## Impact

- 新增前后端网站项目结构和基础开发命令。
- 新增项目进度领域模型与 mock 数据文件。
- 后续 `project-dashboard-frontend`、`admin-progress-backend`、`cloudbase-persistence` 和 `repository-and-deployment` changes 将依赖此基础。
- 不修改现有 IPD 阶段目录和原始 Excel 文件。
```

## openspec/changes/web-app-foundation/design.md

- Source: openspec/changes/web-app-foundation/design.md
- Lines: 1-47
- SHA256: 35ac2e406d66c9de8065989e15de9d2a6e7737c87a85baff361be0b434cfdaca

```md
## Context

当前项目的进度管理能力沉淀在 `03_开发阶段/CPID710R8_项目进度管理.xlsx` 中。该工作簿包含项目周期、任务计划、实际进度、工期计算、完成比例、预警和甘特图展示逻辑。网站化改造需要先建立统一工程基础和领域模型，后续展示端、管理端、CloudBase 持久化与部署才能围绕同一数据契约推进。

约束包括：遵守双 AI 协作流程，新增 AI 协作产物优先放入 `00_AI协作工作区/`；Comet/OpenSpec 仅使用 Codex 专用工作区；本 change 不依赖腾讯云账号密钥。

## Goals / Non-Goals

**Goals:**
- 建立可本地运行的网站项目基础，支持后续前端展示、管理端和数据持久化扩展。
- 定义项目进度领域模型，使 Excel 字段可以映射为结构化数据。
- 提供 mock 数据源，确保没有 CloudBase 配置时也能开发和验证。
- 建立数据访问抽象，后续可替换为后端 API 或 CloudBase 适配器。

**Non-Goals:**
- 不实现完整仪表盘、甘特图或移动端横屏交互。
- 不实现管理端登录、权限、任务编辑表单。
- 不接入真实 CloudBase 环境或保存密钥。
- 不执行 GitHub/Gitee 推送或扣子部署。

## Decisions

1. **以项目进度领域模型作为前后端契约**
   - 选择：先定义 `Project`、`ProjectTask`、`ProgressMetrics`、`WarningState` 等核心结构。
   - 理由：Excel 已经证明这些字段是业务核心，前端展示、后端维护和 CloudBase 存储都需要共享语义。
   - 替代方案：直接按 Excel 行列渲染。该方案短期快，但会使后续后台编辑、云端查询和仪表盘聚合变得脆弱。

2. **以 mock 数据作为首个数据源**
   - 选择：从现有 Excel 抽取或手工整理首版 mock 数据，作为本地开发默认数据。
   - 理由：用户后续才提供 CloudBase 账号密钥，基础工程不能被云环境阻塞。
   - 替代方案：一开始接 CloudBase。该方案会把基础工程和云配置耦合，增加初期不确定性。

3. **数据访问通过仓储/服务抽象暴露**
   - 选择：前端页面通过统一数据服务获取项目和任务，不直接读取具体 mock 文件。
   - 理由：后续 `admin-progress-backend` 和 `cloudbase-persistence` 可以替换实现而不改展示层调用方式。
   - 替代方案：页面直接 import 数据。该方案简单但迁移成本高。

4. **基础工程只提供最小可运行体验**
   - 选择：本 change 只要求项目能启动并展示基础项目数据占位或简单列表。
   - 理由：仪表盘、后台和 CloudBase 均已拆为独立 changes，避免基础 change 范围膨胀。

## Risks / Trade-offs

- [Risk] Excel 中公式计算逻辑与网站字段语义不完全一致 → Mitigation: 在模型中区分输入字段和派生字段，后续实现时保留可测试计算函数。
- [Risk] 过早选择技术栈可能影响扣子部署 → Mitigation: 基础工程需记录技术栈选择理由，并在部署 change 中验证适配性。
- [Risk] mock 数据与后续 CloudBase schema 偏离 → Mitigation: mock 数据使用与领域模型一致的结构，CloudBase change 基于同一契约建模。
- [Risk] 多 change 并行时边界混淆 → Mitigation: 每个 change 的 proposal/spec/tasks 明确非目标和依赖顺序。
```

## openspec/changes/web-app-foundation/tasks.md

- Source: openspec/changes/web-app-foundation/tasks.md
- Lines: 1-23
- SHA256: 76a23c5f71cd3fbee965be687120b0f424254203d379a6b2152750b1eedd9547

```md
## 1. Project Setup

- [ ] 1.1 Select and document the frontend/backend project structure and local development commands.
- [ ] 1.2 Create the minimal runnable website application with routing and base layout.
- [ ] 1.3 Add repository scripts for local development, build, lint or equivalent validation.

## 2. Domain Model and Mock Data

- [ ] 2.1 Define project progress domain types for project metadata, tasks, schedule fields, progress metrics, warning state, owners, and remarks.
- [ ] 2.2 Convert the current CPID710R8 Excel schedule into a structured mock data source.
- [ ] 2.3 Separate editable input fields from derived progress fields so later calculations and persistence remain clear.

## 3. Data Access Foundation

- [ ] 3.1 Implement a project progress data service that reads from the mock data source.
- [ ] 3.2 Ensure UI code consumes project data through the data service contract rather than directly importing raw data.
- [ ] 3.3 Document how later backend or CloudBase adapters should replace the mock data source.

## 4. Verification

- [ ] 4.1 Verify the application starts locally without CloudBase credentials.
- [ ] 4.2 Verify at least one CPID710R8 task row is represented with schedule, progress, ownership, and warning fields.
- [ ] 4.3 Record verification commands and results in the AI collaboration workspace version notes when implementation is completed.
```

## openspec/changes/web-app-foundation/specs/project-web-foundation/spec.md

- Source: openspec/changes/web-app-foundation/specs/project-web-foundation/spec.md
- Lines: 1-29
- SHA256: a3ff5f54b3bf5890d279500133b69239da05459326a58f0e4a9cb602bf9ae8e8

```md
## ADDED Requirements

### Requirement: Website foundation is runnable locally
The system SHALL provide a website project foundation that can be installed and started in a local development environment without requiring Tencent CloudBase credentials.

#### Scenario: Start local development site
- **WHEN** a developer follows the documented local startup command
- **THEN** the website starts successfully using local or mock project data

### Requirement: Project progress domain model
The system SHALL define structured project progress entities covering project metadata, milestones or tasks, planned dates, actual dates, duration fields, completion ratio, warning state, resource owner, responsible person, and remarks.

#### Scenario: Represent Excel task row
- **WHEN** a task from `CPID710R8_项目进度管理.xlsx` is mapped into the website model
- **THEN** the model preserves the task identity, schedule, progress, warning, ownership, and remark fields needed by later display and editing features

### Requirement: Mock data source
The system SHALL include a mock data source based on the current CPID710R8 project schedule so downstream frontend work can proceed before CloudBase is configured.

#### Scenario: Load project data without cloud configuration
- **WHEN** the application runs without CloudBase environment variables
- **THEN** it loads project and task data from the mock source rather than failing

### Requirement: Data access abstraction
The system SHALL expose project progress data through a data access abstraction rather than coupling views directly to mock data files.

#### Scenario: Replace data source later
- **WHEN** a CloudBase-backed data source is introduced in a later change
- **THEN** display components can continue using the same data access contract without direct rewrites for storage details
```

