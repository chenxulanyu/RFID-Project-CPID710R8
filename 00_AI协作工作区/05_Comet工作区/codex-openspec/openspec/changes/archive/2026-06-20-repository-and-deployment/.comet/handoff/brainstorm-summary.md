# Brainstorm Summary

- Change: repository-and-deployment
- Date: 2026-06-20

## 已确认上下文

- 当前 change 目标是仓库发布和部署准备，不实现新业务功能。
- 用户将自行在扣子编程执行部署，Codex 当前不需要账号、密钥或平台凭证。
- 现有 `web/README.md` 已记录本地开发、测试、构建、路由、CloudBase 配置和验证边界。
- 现有 `web/.env.example` 只包含前端安全的 CloudBase 占位变量。
- 根目录 `.gitignore` 已排除 `node_modules/`、`dist/`、`.env`、`.env.*`、`.DS_Store` 和 `.superpowers/`。

## 确认的技术方案

采用方案 A：轻量文档补齐。

实施范围聚焦文档、清单和安全检查：

- 新增或补齐根目录 README，说明项目目的、目录关系、本地开发、测试、构建、CloudBase 配置边界和双 AI 协作工作区。
- 新增发布部署说明，覆盖 GitHub/Gitee 远程准备、扣子手动部署、CloudBase 前端安全变量、上线后验证。
- 新增发布前 readiness checklist，覆盖本地验证、前端展示、后台维护、CloudBase 连通、环境变量和敏感信息检查。
- 复用现有 `web/README.md`、`web/.env.example` 和根目录 `.gitignore`，避免重复维护技术细节。
- 不新增自动推送脚本，不新增部署脚本，不接触账号密钥。

## 关键取舍与风险

- 放弃平台专用配置文件：扣子具体部署形态仍由用户手动执行，提前固化配置可能不准。
- 放弃自动化发布脚本：当前没有用户授权和凭证，脚本反而增加误用风险。
- 文档需要和现有 `web/package.json`、`web/.env.example` 保持一致；实施时通过命令和字段检查降低漂移。

## 测试策略

- 运行 `cd web && npm test`。
- 运行 `cd web && npm run build`。
- 检查文档中的命令、环境变量名称和现有 `package.json` / `.env.example` 保持一致。
- 搜索敏感字段，确认没有真实 CloudBase 密钥、GitHub/Gitee token 或部署密钥进入提交内容。

## Spec Patch

无候选变更；当前 delta spec 已覆盖仓库文档、密钥排除、部署说明、授权外部操作和发布检查清单。
