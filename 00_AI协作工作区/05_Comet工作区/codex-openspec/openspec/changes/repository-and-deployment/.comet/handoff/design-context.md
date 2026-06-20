# Comet Design Handoff

- Change: repository-and-deployment
- Phase: design
- Mode: compact
- Context hash: cf1466f83c52c957a3300dcc74ad7d82da45eafdf1dde9390da9757e87aa23e4

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/repository-and-deployment/proposal.md

- Source: openspec/changes/repository-and-deployment/proposal.md
- Lines: 1-25
- SHA256: 5d114d8f367fe442a79050fed7c906d9bf0bdb1da1f9ea713b97e50b5789ab4f

```md
## Why

网站功能完成后需要进入代码托管和部署流程。用户计划后续提供 GitHub 和 Gitee 账号，并在扣子上部署网站，因此需要独立准备仓库发布、环境配置和部署说明，避免部署细节干扰核心功能开发。

## What Changes

- 准备 GitHub/Gitee 代码托管所需的仓库结构、忽略规则、README 和推送前检查清单。
- 明确敏感信息处理规则，避免 CloudBase 密钥或部署密钥进入代码仓库。
- 编写部署说明，覆盖构建命令、环境变量、CloudBase 配置和扣子部署所需信息。
- 提供发布前验证清单，确保前端展示、后台维护和 CloudBase 配置在部署前可检查。
- 本 change 不实现业务功能、不创建真实远程仓库、不使用用户账号推送、不执行最终扣子部署，除非用户后续明确授权。

## Capabilities

### New Capabilities
- `repository-deployment-readiness`: 代码托管与部署准备能力，包括仓库配置、安全检查、部署文档和发布前验证。

### Modified Capabilities
- 无。

## Impact

- 依赖前序功能 changes 的实现结果和 CloudBase 配置方式。
- 可能新增 README、部署文档、环境变量示例、`.gitignore`、发布检查清单和 CI/构建说明。
- 涉及用户账号和部署平台操作，必须在用户明确提供凭证并授权后执行。
```

## openspec/changes/repository-and-deployment/design.md

- Source: openspec/changes/repository-and-deployment/design.md
- Lines: 1-44
- SHA256: 170fd0bcb58649f6d998084265b2c98e99d81e777309fd099b915c644fe5fafd

```md
## Context

用户计划在功能完成后提供 GitHub 和 Gitee 账号，并将项目部署到扣子。由于仓库推送和部署涉及账号、密钥、公开范围和运行环境，必须独立规划，避免在未确认授权和环境信息前执行外部操作。

## Goals / Non-Goals

**Goals:**
- 准备代码托管所需的仓库文档、忽略规则和推送前检查。
- 准备部署文档，说明构建命令、环境变量和 CloudBase 配置。
- 定义扣子部署前需要确认的信息和验证步骤。
- 明确敏感信息不得提交，外部账号操作必须等待用户授权。

**Non-Goals:**
- 不实现项目业务功能。
- 不创建远程 GitHub/Gitee 仓库。
- 不使用用户账号执行推送或部署，除非后续明确授权。
- 不记录真实访问令牌、CloudBase 密钥或扣子平台密钥。

## Decisions

1. **发布工作延后到功能和配置稳定后执行**
   - 选择：先准备文档和检查清单，等前序 changes 验证后再推送部署。
   - 理由：部署依赖技术栈、CloudBase 配置和构建产物，过早部署会产生返工。
   - 替代方案：边开发边部署。该方案反馈快，但会放大未稳定配置的风险。

2. **GitHub 和 Gitee 使用同一代码源准备**
   - 选择：保持仓库结构、README、忽略规则和环境示例对两个平台兼容。
   - 理由：减少双平台维护差异。
   - 替代方案：分别维护两套发布说明。该方案更细，但当前阶段收益不足。

3. **部署说明采用“占位配置 + 用户授权执行”**
   - 选择：文档记录变量名、构建命令和操作步骤，不记录真实凭证。
   - 理由：符合安全要求，也便于用户在扣子平台手动或授权配置。

4. **发布前检查必须覆盖功能与密钥安全**
   - 选择：检查清单包括本地构建、展示端、后台维护、CloudBase 连通、敏感文件扫描。
   - 理由：上线问题常来自配置遗漏和密钥误提交。

## Risks / Trade-offs

- [Risk] 扣子部署方式不明确 → Mitigation: 在部署 change 实施前要求用户提供目标部署方式或平台约束。
- [Risk] 账号凭证误用或误提交 → Mitigation: 所有外部操作等待明确授权，真实密钥只通过平台安全配置输入。
- [Risk] GitHub/Gitee 双平台分支状态不一致 → Mitigation: 发布文档记录推荐推送顺序和验证点。
- [Risk] CloudBase 环境变量遗漏导致线上不可用 → Mitigation: 部署清单必须列出必需变量和启动后验证步骤。
```

## openspec/changes/repository-and-deployment/tasks.md

- Source: openspec/changes/repository-and-deployment/tasks.md
- Lines: 1-23
- SHA256: 6994ca6cefd3787c70cfd3ef50b1b155a68b2a60cb08e5e8f25384d14605ecf3

```md
## 1. Repository Preparation

- [ ] 1.1 Add or update README content for project purpose, local setup, and validation commands.
- [ ] 1.2 Add or update ignore rules for local environment files, build outputs, and secret-bearing files.
- [ ] 1.3 Prepare GitHub and Gitee remote setup notes without storing credentials.

## 2. Configuration and Secret Safety

- [ ] 2.1 Provide environment variable examples with placeholder values only.
- [ ] 2.2 Add a pre-push sensitive file review checklist.
- [ ] 2.3 Verify real CloudBase, repository, and deployment secrets are not committed.

## 3. Deployment Documentation

- [ ] 3.1 Document build and start commands for the selected website stack.
- [ ] 3.2 Document runtime variables required for CloudBase-backed operation.
- [ ] 3.3 Document Coze or selected deployment platform steps after user confirms the target deployment path.

## 4. Release Readiness

- [ ] 4.1 Create a release readiness checklist covering local build, frontend display, admin update flow, and CloudBase connectivity.
- [ ] 4.2 Pause for explicit user authorization before remote repository creation, push, or deployment.
- [ ] 4.3 Record final deployment verification results in the AI collaboration workspace when deployment is performed.
```

## openspec/changes/repository-and-deployment/specs/repository-deployment-readiness/spec.md

- Source: openspec/changes/repository-and-deployment/specs/repository-deployment-readiness/spec.md
- Lines: 1-36
- SHA256: c760829d2cc8db7bbde33ecef5bc716dc36ca81e87e97585ca99b07f4a93fd3d

```md
## ADDED Requirements

### Requirement: Repository readiness documentation
The system SHALL include repository readiness documentation covering project purpose, local setup, build commands, validation commands, and the relationship to the AI collaboration workflow.

#### Scenario: Prepare repository handoff
- **WHEN** the project is ready to be pushed to GitHub or Gitee
- **THEN** a maintainer can follow the repository documentation to understand setup and validation steps

### Requirement: Secret exclusion
The system SHALL exclude real CloudBase credentials, repository tokens, deployment keys, and platform secrets from committed files.

#### Scenario: Review before push
- **WHEN** a maintainer performs the push readiness check
- **THEN** committed files contain only placeholder environment variable names or examples, not real secret values

### Requirement: Deployment instructions
The system SHALL provide deployment instructions that identify required build commands, runtime configuration, CloudBase environment variables, and post-deployment checks for the target deployment platform.

#### Scenario: Prepare Coze deployment
- **WHEN** the user is ready to deploy the website to Coze or the selected deployment environment
- **THEN** the instructions list the required configuration and verification steps without exposing secrets

### Requirement: Authorized external operations
The system SHALL require explicit user authorization before creating remote repositories, pushing to GitHub or Gitee, or performing deployment operations with user accounts.

#### Scenario: Attempt remote push
- **WHEN** repository credentials or remote targets are needed
- **THEN** the workflow pauses until the user provides credentials and explicitly authorizes the operation

### Requirement: Release readiness checklist
The system SHALL provide a release readiness checklist covering local build, frontend display, administrative update flow, CloudBase connectivity, environment configuration, and sensitive file review.

#### Scenario: Run release checklist
- **WHEN** the project is considered ready for deployment
- **THEN** the checklist guides verification of core functionality and deployment safety before external release
```

