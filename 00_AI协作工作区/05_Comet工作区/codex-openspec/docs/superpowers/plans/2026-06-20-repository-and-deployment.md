---
change: repository-and-deployment
design-doc: docs/superpowers/specs/2026-06-20-repository-and-deployment-design.md
base-ref: df8da42b1961a23a7bad1d3609fee08a49d77bf2
archived-with: 2026-06-20-repository-and-deployment
---

# Repository And Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Prepare repository handoff and manual Coze deployment documentation without storing credentials or performing external account operations.

**Architecture:** Add repository-level documentation artifacts while preserving the existing web app implementation and CloudBase repository boundary. Root documentation points maintainers to the `web/` app, deployment documentation records manual GitHub/Gitee/Coze steps, and a release checklist captures verification evidence before push or deployment.

**Tech Stack:** Markdown documentation, Git, React/Vite/TypeScript web app commands, Tencent CloudBase frontend-safe environment variables.

---

## File Structure

- Create `README.md`: repository-level overview, structure, setup, validation, data-source boundary, and dual-AI workflow entry point.
- Create `docs/deployment.md`: GitHub/Gitee preparation, Coze manual deployment notes, CloudBase runtime configuration, and explicit authorization boundary.
- Create `docs/release-readiness-checklist.md`: pre-release checklist for build/test, frontend display, admin maintenance, CloudBase connectivity, environment variables, and sensitive files.
- Modify `.gitignore` only if a secret-bearing or generated file gap is found.
- Modify `00_AI协作工作区/03_版本迭代/VERSION.md`: record the repository/deployment readiness iteration.
- Modify `00_AI协作工作区/03_版本迭代/CHANGELOG.md`: record user-facing changes and validation notes.
- Modify `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/repository-and-deployment/tasks.md`: check off tasks after implementation and verification.

## Task 1: Repository-Level README

**Files:**
- Create: `README.md`
- Reference: `web/README.md`
- Reference: `AGENTS.md`

- [x] **Step 1: Inspect current web app commands and routes**

Run:

```bash
sed -n '1,220p' web/package.json
sed -n '1,260p' web/README.md
```

Expected: commands include `dev`, `test`, `build`, `preview`; routes include `/`, `/dashboard`, and `/admin`.

- [x] **Step 2: Create root README**

Create `README.md` with:

```md
# CPID710R8 RFID 项目管理网站

本仓库承载 CPID710R8 RFID 项目管理网站及配套 AI 协作产物。网站前端位于 `web/`，用于展示项目概况、开发进度和后台维护入口；既有 IPD 阶段资料保留在原阶段目录中，不在发布准备过程中重排。

## 目录结构

- `web/`: React + Vite + TypeScript 网站工程。
- `00_AI协作工作区/`: Codex 与 Claude Code 的需求、版本、审查和 Comet/OpenSpec 产物。
- `00_模板与规范/` 至 `06_生命周期管理/`: 项目 IPD 阶段资料。
- `保点定制读写器原始资料/`: 原始输入资料。

## 本地开发

```bash
cd web
npm install
npm run dev
```

## 验证命令

```bash
cd web
npm test
npm run build
```

## 主要页面

- `/`: 项目基础信息。
- `/dashboard`: 项目进度仪表盘。
- `/admin`: 项目进度维护后台。

## 数据源

默认可使用本地数据。配置 `VITE_PROJECT_DATA_SOURCE=cloudbase` 后，网站通过 Tencent CloudBase Web SDK 读取和维护项目数据。CloudBase 变量请参考 `web/.env.example`，真实值只允许写入本地未跟踪 `.env` 或部署平台环境变量。

禁止把 CloudBase `secretId`、`secretKey`、GitHub/Gitee token、扣子部署密钥或其他真实凭证提交到仓库。

## 部署与发布

发布前请阅读：

- `docs/deployment.md`
- `docs/release-readiness-checklist.md`
- `web/README.md`

Codex 不会在未获明确授权时创建远程仓库、推送 GitHub/Gitee 或执行扣子部署。

## 双 AI 协作

本项目按 `AGENTS.md` 和 `00_AI协作工作区/README.md` 执行双 AI 协作流程。Codex 默认负责规划和实现，Claude Code 默认负责只读审查并将报告写入 `00_AI协作工作区/04_审查记录/`。
```

- [x] **Step 3: Verify README references exist**

Run:

```bash
test -f README.md
test -f docs/deployment.md || true
test -f docs/release-readiness-checklist.md || true
test -f web/.env.example
```

Expected: no error for `README.md` and `web/.env.example`; docs files may not exist until later tasks.

## Task 2: Deployment Guide

**Files:**
- Create: `docs/deployment.md`
- Reference: `web/.env.example`
- Reference: `web/package.json`

- [x] **Step 1: Create docs directory**

Run:

```bash
mkdir -p docs
```

- [x] **Step 2: Create deployment guide**

Create `docs/deployment.md` with:

```md
# 部署与仓库发布说明

本文档用于 CPID710R8 项目管理网站的 GitHub/Gitee 仓库准备和扣子手动部署。除非用户明确授权，Codex 不创建远程仓库、不推送代码、不执行部署。

## 构建产物

网站工程位于 `web/`。

```bash
cd web
npm install
npm test
npm run build
```

构建产物输出到 `web/dist/`。`dist/` 不提交到 Git。

## 环境变量

参考 `web/.env.example`：

```env
VITE_PROJECT_DATA_SOURCE=local
VITE_CLOUDBASE_ENV_ID=
VITE_CLOUDBASE_ACCESS_KEY=
VITE_CLOUDBASE_PROJECT_ID=cpid710r8
VITE_CLOUDBASE_PROJECTS_COLLECTION=projects
VITE_CLOUDBASE_TASKS_COLLECTION=project_tasks
```

线上使用 CloudBase 时通常设置：

```env
VITE_PROJECT_DATA_SOURCE=cloudbase
VITE_CLOUDBASE_ENV_ID=<cloudbase-env-id>
VITE_CLOUDBASE_ACCESS_KEY=<cloudbase-web-sdk-publishable-key-if-required>
VITE_CLOUDBASE_PROJECT_ID=cpid710r8
VITE_CLOUDBASE_PROJECTS_COLLECTION=projects
VITE_CLOUDBASE_TASKS_COLLECTION=project_tasks
```

不要把 `secretId`、`secretKey`、个人访问令牌或部署密钥放入 Vite 前端环境变量。

## CloudBase 上线前配置

在 CloudBase 控制台确认：

- 已配置部署域名或安全域名。
- 已配置符合项目需要的认证方式。
- 数据库集合与环境变量一致。
- 数据库权限允许展示端读取项目数据。
- `/admin` 所需写入权限已按你的维护方式配置。
- 使用非敏感测试数据验证读取、编辑、归档和恢复。

## GitHub/Gitee 准备

在用户提供账号并明确授权前，只准备说明，不执行远程操作。

推荐发布前本地检查：

```bash
git status --short
git diff --stat
cd web && npm test && npm run build
```

用户授权后再配置远程仓库，例如：

```bash
git remote add origin <github-or-gitee-repository-url>
git push -u origin main
```

如需同时推送 GitHub 和 Gitee，建议一个平台推送并验证后，再添加第二个 remote，避免两个远程状态混乱。

## 扣子手动部署

用户在扣子编程中手动执行部署时，推荐使用：

- 根目录：`web`
- 安装命令：`npm install`
- 构建命令：`npm run build`
- 输出目录：`dist`
- 环境变量：按本文档的 CloudBase 变量配置

部署后检查：

- `/` 可以加载项目基础信息。
- `/dashboard` 可以展示进度仪表盘。
- `/admin` 可以打开维护后台。
- CloudBase 模式下，编辑任务后刷新页面数据仍保留。

## 授权边界

以下操作必须暂停等待用户明确授权：

- 创建 GitHub/Gitee 远程仓库。
- 添加或修改真实 remote URL。
- 使用用户账号推送代码。
- 在部署平台写入真实环境变量。
- 执行扣子部署或任何外部发布操作。
```

- [x] **Step 3: Check environment variable names match the example**

Run:

```bash
for key in VITE_PROJECT_DATA_SOURCE VITE_CLOUDBASE_ENV_ID VITE_CLOUDBASE_ACCESS_KEY VITE_CLOUDBASE_PROJECT_ID VITE_CLOUDBASE_PROJECTS_COLLECTION VITE_CLOUDBASE_TASKS_COLLECTION; do
  rg -q "$key" web/.env.example
  rg -q "$key" docs/deployment.md
done
```

Expected: command exits with status 0.

## Task 3: Release Readiness Checklist

**Files:**
- Create: `docs/release-readiness-checklist.md`

- [x] **Step 1: Create checklist**

Create `docs/release-readiness-checklist.md` with:

```md
# 发布前检查清单

在推送 GitHub/Gitee 或手动部署到扣子前，逐项确认。

## 本地状态

- [x] `git status --short` 已检查，变更范围清楚。
- [x] 不相关用户资料或 IPD 文档未被误改。
- [x] `web/node_modules/`、`web/dist/`、`.env` 未准备提交。

## 构建与测试

- [x] `cd web && npm test` 通过。
- [x] `cd web && npm run build` 通过。
- [x] 如出现 Vite chunk size warning，已确认不影响部署。

## 页面检查

- [x] `/` 可展示项目基础信息。
- [x] `/dashboard` 可展示仪表盘和项目进度。
- [x] `/admin` 可编辑项目元数据和任务。
- [x] 移动端横屏提示或横屏展示行为符合当前前端设计。
- [x] 页面文本没有明显溢出框体。

## CloudBase

- [x] 部署平台已配置 `VITE_PROJECT_DATA_SOURCE=cloudbase`，或确认继续使用 local 模式。
- [x] CloudBase 环境 ID、项目 ID、集合名和 Web SDK Publishable Key 已配置在平台环境变量中。
- [x] CloudBase 安全域名/允许来源包含部署域名。
- [x] 数据库权限允许展示端读取。
- [x] `/admin` 维护所需写入权限已验证。
- [x] 使用非敏感测试数据验证读取、编辑、归档、恢复和刷新保留。

## 敏感信息

- [x] 未提交 `.env`、`.env.local` 或任何真实环境文件。
- [x] 未提交 CloudBase `secretId` 或 `secretKey`。
- [x] 未提交 GitHub/Gitee token。
- [x] 未提交扣子平台密钥或部署令牌。
- [x] 文档中的密钥均为 `<placeholder>` 或空值示例。

## 仓库与部署授权

- [x] 用户已确认是否创建远程仓库。
- [x] 用户已确认是否推送 GitHub。
- [x] 用户已确认是否推送 Gitee。
- [x] 用户已确认扣子部署由用户手动执行，或已单独授权 Codex 执行外部操作。

## 发布记录

- [x] `00_AI协作工作区/03_版本迭代/VERSION.md` 已更新。
- [x] `00_AI协作工作区/03_版本迭代/CHANGELOG.md` 已更新。
- [x] 如 Claude Code 参与审查，审查报告已写入 `00_AI协作工作区/04_审查记录/`。
- [x] 部署完成后，最终线上验证结果已记录到 AI 协作工作区。
```

- [x] **Step 2: Verify checklist covers OpenSpec scenarios**

Run:

```bash
for phrase in "构建与测试" "页面检查" "CloudBase" "敏感信息" "仓库与部署授权" "发布记录"; do
  rg -q "$phrase" docs/release-readiness-checklist.md
done
```

Expected: command exits with status 0.

## Task 4: Secret Exclusion And Documentation Consistency

**Files:**
- Modify: `.gitignore` if needed
- Reference: `README.md`
- Reference: `docs/deployment.md`
- Reference: `docs/release-readiness-checklist.md`

- [x] **Step 1: Inspect ignore coverage**

Run:

```bash
sed -n '1,120p' .gitignore
```

Expected: `.env`, `.env.*`, `node_modules/`, `dist/`, `.DS_Store`, and `.superpowers/` are ignored while `!.env.example` is allowed.

- [x] **Step 2: Add missing ignore rules only if needed**

If Step 1 lacks a required rule, modify `.gitignore` to include:

```gitignore
node_modules/
dist/
*.tsbuildinfo
.env
.env.*
!.env.example
.DS_Store
.superpowers/
```

If the rules already exist, do not change `.gitignore`.

- [x] **Step 3: Search for forbidden secret-bearing values in planned committed files**

Run:

```bash
rg -n --glob '!web/node_modules/**' --glob '!web/dist/**' --glob '!*.md' "VITE_CLOUDBASE_SECRET_ID|VITE_CLOUDBASE_SECRET_KEY|secretId|secretKey|GITHUB_TOKEN|GITEE_TOKEN|COZE_TOKEN|AKIA[0-9A-Z]{16}" .
rg -n "secretId|secretKey|GITHUB_TOKEN|GITEE_TOKEN|COZE_TOKEN|AKIA[0-9A-Z]{16}" README.md docs web/.env.example
```

Expected: no real credential values. Mentions of forbidden field names are allowed only when explaining that they must not be committed.

## Task 5: Version Records And OpenSpec Tasks

**Files:**
- Modify: `00_AI协作工作区/03_版本迭代/VERSION.md`
- Modify: `00_AI协作工作区/03_版本迭代/CHANGELOG.md`
- Modify: `00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/repository-and-deployment/tasks.md`

- [x] **Step 1: Inspect existing version records**

Run:

```bash
sed -n '1,220p' '00_AI协作工作区/03_版本迭代/VERSION.md'
sed -n '1,260p' '00_AI协作工作区/03_版本迭代/CHANGELOG.md'
```

- [x] **Step 2: Add repository/deployment readiness version entry**

Append an entry describing:

- repository handoff documentation
- deployment guide
- release readiness checklist
- secret safety boundary
- validation commands

- [x] **Step 3: Mark OpenSpec tasks complete**

After Tasks 1-4 and validation pass, update `openspec/changes/repository-and-deployment/tasks.md` so all 12 task checkboxes are checked.

## Task 6: Final Verification

**Files:**
- Read: `README.md`
- Read: `docs/deployment.md`
- Read: `docs/release-readiness-checklist.md`
- Read: `web/package.json`
- Read: `web/.env.example`

- [x] **Step 1: Run web tests**

Run:

```bash
cd web && npm test
```

Expected: all tests pass.

- [x] **Step 2: Run production build**

Run:

```bash
cd web && npm run build
```

Expected: TypeScript and Vite build pass. A Vite chunk-size warning is acceptable if build exits successfully.

- [x] **Step 3: Verify documentation command consistency**

Run:

```bash
for script in "npm install" "npm test" "npm run build"; do
  rg -q "$script" README.md docs/deployment.md
done
for route in "/dashboard" "/admin"; do
  rg -q "$route" README.md docs/release-readiness-checklist.md
done
```

Expected: command exits with status 0.

- [x] **Step 4: Verify git diff scope**

Run:

```bash
git diff --stat
```

Expected: diff is limited to repository/deployment docs, version records, and current OpenSpec change state.

- [x] **Step 5: Commit completed build work**

Run:

```bash
git add README.md docs/deployment.md docs/release-readiness-checklist.md .gitignore \
  '00_AI协作工作区/03_版本迭代/VERSION.md' \
  '00_AI协作工作区/03_版本迭代/CHANGELOG.md' \
  '00_AI协作工作区/05_Comet工作区/codex-openspec/openspec/changes/repository-and-deployment' \
  '00_AI协作工作区/05_Comet工作区/codex-openspec/docs/superpowers/specs/2026-06-20-repository-and-deployment-design.md' \
  '00_AI协作工作区/05_Comet工作区/codex-openspec/docs/superpowers/plans/2026-06-20-repository-and-deployment.md'
git commit -m "docs: prepare repository deployment readiness"
```

Expected: commit succeeds without staging unrelated IPD source files or Claude-only workspace files.

## Self-Review

- Spec coverage: Tasks cover repository readiness documentation, secret exclusion, deployment instructions, authorized external operations, and release readiness checklist.
- Placeholder scan: placeholder examples are intentional in docs and must remain non-secret.
- Scope check: no business functionality, remote repository creation, push, or deployment is included.
