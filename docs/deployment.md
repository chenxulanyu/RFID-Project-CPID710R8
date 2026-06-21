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

- 根目录：仓库根目录
- 根目录 `package.json`：用于满足扣子 runtime 打包阶段在仓库根目录执行 npm 命令的要求，并通过 workspace scripts 指向 `web/`
- 平台配置文件：仓库根目录 `.coze`
- 开发构建：`.coze` 会执行 `npm run install`
- 开发运行：`.coze` 会执行 `npm run start`
- 部署构建：`.coze` 会执行 `npm run build`
- 部署运行：`.coze` 会执行 `npm run start`
- 环境变量：按本文档的 CloudBase 变量配置

部署后检查：

- `/` 可以加载项目进度仪表盘。
- `/admin` 可以打开维护后台。
- CloudBase 模式下，编辑任务后刷新页面数据仍保留。

## 授权边界

以下操作必须暂停等待用户明确授权：

- 创建 GitHub/Gitee 远程仓库。
- 添加或修改真实 remote URL。
- 使用用户账号推送代码。
- 在部署平台写入真实环境变量。
- 执行扣子部署或任何外部发布操作。
