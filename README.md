# CPID710R8 RFID 项目管理网站

本仓库承载 CPID710R8 RFID 项目管理网站及配套 AI 协作产物。网站前端位于 `web/`，用于展示项目概况、开发进度和后台维护入口；既有 IPD 阶段资料保留在原阶段目录中，不在发布准备过程中重排。

## 目录结构

- `web/`: React + Vite + TypeScript 网站工程。
- `docs/`: 仓库发布、部署和发布前检查文档。
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

- `/`: 项目进度仪表盘。
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
