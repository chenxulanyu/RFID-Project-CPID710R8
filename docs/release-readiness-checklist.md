# 发布前检查清单

在推送 GitHub/Gitee 或手动部署到扣子前，逐项确认。

## 本地状态

- [ ] `git status --short` 已检查，变更范围清楚。
- [ ] 不相关用户资料或 IPD 文档未被误改。
- [ ] `web/node_modules/`、`web/dist/`、`.env` 未准备提交。

## 构建与测试

- [ ] `cd web && npm test` 通过。
- [ ] `cd web && npm run build` 通过。
- [ ] 如出现 Vite chunk size warning，已确认不影响部署。

## 页面检查

- [ ] `/` 可展示项目基础信息。
- [ ] `/dashboard` 可展示仪表盘和项目进度。
- [ ] `/admin` 可编辑项目元数据和任务。
- [ ] 移动端横屏提示或横屏展示行为符合当前前端设计。
- [ ] 页面文本没有明显溢出框体。

## CloudBase

- [ ] 部署平台已配置 `VITE_PROJECT_DATA_SOURCE=cloudbase`，或确认继续使用 local 模式。
- [ ] CloudBase 环境 ID、项目 ID、集合名和 Web SDK Publishable Key 已配置在平台环境变量中。
- [ ] CloudBase 安全域名/允许来源包含部署域名。
- [ ] 数据库权限允许展示端读取。
- [ ] `/admin` 维护所需写入权限已验证。
- [ ] 使用非敏感测试数据验证读取、编辑、归档、恢复和刷新保留。

## 敏感信息

- [ ] 未提交 `.env`、`.env.local` 或任何真实环境文件。
- [ ] 未提交 CloudBase `secretId` 或 `secretKey`。
- [ ] 未提交 GitHub/Gitee token。
- [ ] 未提交扣子平台密钥或部署令牌。
- [ ] 文档中的密钥均为 `<placeholder>` 或空值示例。

## 仓库与部署授权

- [ ] 用户已确认是否创建远程仓库。
- [ ] 用户已确认是否推送 GitHub。
- [ ] 用户已确认是否推送 Gitee。
- [ ] 用户已确认扣子部署由用户手动执行，或已单独授权 Codex 执行外部操作。

## 发布记录

- [ ] `00_AI协作工作区/03_版本迭代/VERSION.md` 已更新。
- [ ] `00_AI协作工作区/03_版本迭代/CHANGELOG.md` 已更新。
- [ ] 如 Claude Code 参与审查，审查报告已写入 `00_AI协作工作区/04_审查记录/`。
- [ ] 部署完成后，最终线上验证结果已记录到 AI 协作工作区。
