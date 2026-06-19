# CHANGELOG

## v0.1 - 2026-06-19

- 建立双 AI 协作工作区。
- 新增 Codex 与 Claude Code 入口规则。
- 新增审查规则、角色权限、Comet 隔离规则。
- 约定 Claude Code 审查时可以运行测试、构建和检查命令，但不得修改业务代码。

## web-app-foundation v1.0 - 2026-06-19

- 新增 React + Vite + TypeScript 网站基础工程。
- 新增 CPID710R8 项目进度领域模型、mock 数据和数据访问服务。
- 新增项目基础展示页与 `/admin` 后台占位路由。
- 验证：`npm test` 通过，3 个测试文件、8 条测试用例通过。
- 验证：`npm run build` 通过，已生成 `web/dist/` 静态构建产物。
- 处理 Codex 自动审查反馈：已完成任务不再标记为逾期；新增 `web/README.md` 说明本地启动、验证命令和后续 CloudBase adapter 替换边界。
- 可交给 Claude Code 审查：是。
