# Comet Design Handoff

- Change: admin-progress-backend
- Phase: design
- Mode: compact
- Context hash: 1b27156b863cb17fd2989748e6b6431997f994a59ef48096474b1ed82722b192

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/admin-progress-backend/proposal.md

- Source: openspec/changes/admin-progress-backend/proposal.md
- Lines: 1-27
- SHA256: 078f56b0acd932d1fdc616d316cead2f48cfd66da26b03c05bfb61e7a5d69969

```md
## Why

前端展示端需要稳定读取项目数据，但项目内容和具体进度需要由用户在后端持续维护。如果没有独立的管理和后端读写能力，网站会停留在静态展示，无法替代 Excel 的日常维护作用。

## What Changes

- 增加项目进度维护能力，支持维护项目基本信息、任务计划、实际进度、完成比例相关输入、责任人、资源方和备注。
- 增加任务生命周期维护能力，支持新增任务、软归档任务和恢复归档任务，不做物理删除。
- 增加后端读写接口或服务层，为展示端提供统一的项目数据读取能力，并为管理端提供更新能力。
- 增加基础校验，避免结束日期早于开始日期、任务缺少必要字段、手动完成比例越界、完成状态与实际日期明显冲突等问题。
- 预留后续 CloudBase 持久化适配点，但本 change 不接入真实 CloudBase 密钥和云环境。
- 本 change 不实现前端展示仪表盘、不处理 GitHub/Gitee 推送和扣子部署。

## Capabilities

### New Capabilities
- `admin-progress-management`: 项目进度后台维护能力，包括管理端数据编辑、后端读写接口和基础数据校验。

### Modified Capabilities
- 无。

## Impact

- 依赖 `web-app-foundation` 的领域模型和数据访问契约。
- 为 `project-dashboard-frontend` 提供可替换的真实数据来源。
- 为 `cloudbase-persistence` 提供后续云端持久化接入点。
- 可能新增后端路由、管理端页面、服务层、校验函数和测试。
```

## openspec/changes/admin-progress-backend/design.md

- Source: openspec/changes/admin-progress-backend/design.md
- Lines: 1-53
- SHA256: 436367d0fd3fbbdeeb90369615854875962b43ac046dab5781005468ca33e8e7

```md
## Context

网站展示端需要读取项目进度数据，而项目内容、实际进度和备注需要由用户持续维护。当前 Excel 表通过手工修改单元格完成维护，网站化后需要后端或管理端提供结构化读写能力，并为后续 CloudBase 持久化预留适配。

权限模型、账号体系和 CloudBase 凭证尚未确定，因此本 change 聚焦管理能力和数据校验，不擅自扩大为完整多角色权限系统。

## Goals / Non-Goals

**Goals:**
- 提供项目和任务进度数据的维护入口。
- 支持新增任务、软归档任务和恢复归档任务。
- 提供读写接口或服务层，使展示端能获取最新项目数据。
- 对关键字段做基础校验，降低进度数据维护错误。
- 保持存储实现可替换，便于后续接入 CloudBase。

**Non-Goals:**
- 不实现复杂角色权限、组织成员管理或审计日志。
- 不保存真实 CloudBase 密钥。
- 不实现展示端仪表盘视觉组件。
- 不执行部署或仓库推送。

## Decisions

1. **管理端和后端共用领域模型**
   - 选择：维护表单、接口输入输出和展示端读取都围绕 `web-app-foundation` 的项目进度模型。
   - 理由：避免后台字段和前台展示字段漂移。
   - 替代方案：管理端单独建一套表单模型。短期自由，但后续转换和校验成本高。

2. **写入接口校验输入字段，派生字段集中计算**
   - 选择：计划/实际日期、完成状态、责任人、手动完成比例等作为输入；超期、预警、完成统计等通过服务层派生。
   - 理由：减少手工维护派生字段导致的不一致。
   - 替代方案：允许管理员直接填写所有计算结果。该方案灵活但容易失真。

3. **任务删除采用软归档**
   - 选择：支持新增任务、归档任务和恢复任务，不做物理删除；展示端默认隐藏归档任务。
   - 理由：满足后台维护灵活性，同时降低误删导致的数据丢失风险。
   - 替代方案：物理删除任务。实现简单，但误删不可恢复，不适合首版。

4. **先实现单管理员维护边界**
   - 选择：首版按“受控管理入口”设计，不扩展多角色审批。
   - 理由：用户已说明后端由其维护；权限细节未确认，复杂化会拖慢核心进度。
   - 替代方案：完整 RBAC。需要更多需求确认，适合后续 change。

5. **存储通过 repository 接口隔离**
   - 选择：后台读写通过 repository/service 接口，不直接绑定 CloudBase SDK。
   - 理由：本 change 可用本地/mock 存储验证，后续 `cloudbase-persistence` 替换实现。

## Risks / Trade-offs

- [Risk] 未定义登录权限导致管理端暴露风险 → Mitigation: 实现时至少隔离管理路由，并在 CloudBase/部署前确认认证方案。
- [Risk] 校验规则过严影响实际进度维护 → Mitigation: 只做明显错误校验，业务争议字段保留备注说明。
- [Risk] 派生字段口径与 Excel 公式不同 → Mitigation: 将计算函数集中并编写样例验证，必要时记录与 Excel 差异。
- [Risk] 后续 CloudBase 数据结构变化影响接口 → Mitigation: 通过 repository 接口屏蔽存储细节。
```

## openspec/changes/admin-progress-backend/tasks.md

- Source: openspec/changes/admin-progress-backend/tasks.md
- Lines: 1-29
- SHA256: a92c4d7e1bebde64a3d49c43a81a20a5c92406663ccfef391f8f9e93b76b3690

```md
## 1. Management Data Flow

- [ ] 1.1 Define administrative read and write service contracts for project metadata and task data.
- [ ] 1.2 Implement a replaceable repository layer using local or mock persistence for the first version.
- [ ] 1.3 Ensure the display data service can read data maintained through the administrative service.
- [ ] 1.4 Ensure public display reads hide archived tasks while admin reads can include them.

## 2. Admin Maintenance UI or Endpoint

- [ ] 2.1 Provide a management entry for editing project metadata.
- [ ] 2.2 Provide a management entry for creating or updating task progress data.
- [ ] 2.3 Provide management actions for archiving and restoring tasks without physical deletion.
- [ ] 2.4 Keep management routes or endpoints separated from public display routes pending final authentication decisions.

## 3. Validation and Derived Data

- [ ] 3.1 Add validation for required task identity and schedule fields.
- [ ] 3.2 Add validation for date ordering on planned and actual date ranges.
- [ ] 3.3 Add validation for manual completion ratio bounds and duplicate task IDs.
- [ ] 3.4 Centralize derived progress, overdue, and warning calculations in service utilities.
- [ ] 3.5 Ensure actual end date takes precedence over manual completion ratio.

## 4. Verification

- [ ] 4.1 Verify a project metadata update is reflected in subsequent reads.
- [ ] 4.2 Verify a task progress update is reflected in the dashboard data contract.
- [ ] 4.3 Verify a newly created task is reflected in the dashboard data contract.
- [ ] 4.4 Verify archived tasks are hidden from public reads and restored tasks reappear.
- [ ] 4.5 Verify invalid schedule data is rejected with a clear validation error.
```

## openspec/changes/admin-progress-backend/specs/admin-progress-management/spec.md

- Source: openspec/changes/admin-progress-backend/specs/admin-progress-management/spec.md
- Lines: 1-63
- SHA256: c744ea4f866d9d966795b3b4c929efa8e5cd90e5b24333fab9d67926a39a5f83

```md
## ADDED Requirements

### Requirement: Maintain project metadata
The system SHALL provide an administrative capability to view and update project metadata including project name, project period, and descriptive information required by the display frontend.

#### Scenario: Update project period
- **WHEN** an administrator updates the project start or end date with valid dates
- **THEN** the saved project metadata is available to the frontend data service

### Requirement: Maintain task progress data
The system SHALL provide an administrative capability to create or update task data including milestone grouping, task name, planned dates, actual dates, progress input, resource owner, responsible person, and remarks.

#### Scenario: Update task actual progress
- **WHEN** an administrator updates a task's actual start date, actual end date, or progress-related input
- **THEN** subsequent project data reads reflect the updated task information

#### Scenario: Create task
- **WHEN** an administrator creates a task with valid required fields
- **THEN** subsequent project data reads include the new active task

### Requirement: Archive and restore tasks
The system SHALL soft-archive tasks instead of physically deleting them and SHALL allow archived tasks to be restored.

#### Scenario: Archive task
- **WHEN** an administrator archives a task
- **THEN** the public project data read hides the archived task by default
- **AND** the administrative read can still access the archived task

#### Scenario: Restore archived task
- **WHEN** an administrator restores an archived task
- **THEN** subsequent public project data reads include the task again

### Requirement: Validate schedule fields
The system SHALL validate task schedule inputs before saving obvious invalid data such as an end date earlier than its corresponding start date or missing required task identity fields.

#### Scenario: Reject invalid task dates
- **WHEN** an administrator submits a task with a planned end date earlier than the planned start date
- **THEN** the system rejects the change and reports a validation error

### Requirement: Support manual completion override
The system SHALL allow administrators to provide a manual completion ratio while preserving actual completion date as the highest-priority completion signal.

#### Scenario: Manual completion overrides automatic progress
- **WHEN** an administrator saves an active task with a valid manual completion ratio
- **THEN** subsequent project data reads use the manual completion ratio instead of the automatic elapsed-time ratio

#### Scenario: Actual end date takes precedence
- **WHEN** a task has an actual end date and a manual completion ratio below 100%
- **THEN** subsequent project data reads treat the task as 100% complete

### Requirement: Provide project data read service
The system SHALL provide a backend or service-layer read operation that returns project metadata and task progress data using the shared project progress data contract.

#### Scenario: Frontend reads latest project data
- **WHEN** the display frontend requests project progress data
- **THEN** the service returns the latest maintained project metadata and task list

### Requirement: Storage implementation is replaceable
The system SHALL isolate administrative reads and writes behind a storage or repository interface so a later CloudBase adapter can replace local or mock persistence without changing management workflows.

#### Scenario: Swap persistence adapter
- **WHEN** CloudBase persistence is introduced later
- **THEN** the administrative management flow continues using the same service contract
```

