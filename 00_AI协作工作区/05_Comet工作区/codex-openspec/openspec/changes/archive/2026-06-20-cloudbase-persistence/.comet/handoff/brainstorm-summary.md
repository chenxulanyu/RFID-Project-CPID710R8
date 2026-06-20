# Brainstorm Summary

- Change: cloudbase-persistence
- Date: 2026-06-20

## 确认的技术方案

候选方案已确认采用 A：前端直连 CloudBase Web SDK。CloudBase 作为 `ProjectRepository`
的一种实现接入，展示端和管理端仍通过现有 service/repository 契约读写项目数据。前端只配置
CloudBase 环境 ID、集合名和数据源模式，不提交或暴露 `secretId`、`secretKey` 等服务端密钥。

## 关键取舍与风险

- 取舍：保持静态前端部署路径，避免新增云函数或服务端代理。
- 风险：浏览器直连 CloudBase 时，写权限必须依赖 CloudBase 安全域名、登录认证和数据库安全规则。
- 风险：CloudBase 配置缺失或域名未加入安全域名时，应回落到 local/mock 数据或显示可理解错误。
- 依据：CloudBase 官方文档显示 `@cloudbase/js-sdk` v3 支持 Web 初始化和数据库访问，Web 端推荐使用 Publishable Key；Web SDK 使用前需要配置安全域名；数据库文档支持 `add/get/update/set` 等集合文档操作。

## 测试策略

- 用单元测试覆盖 CloudBase 文档和领域模型之间的双向转换。
- 用 mock CloudBase client 覆盖 repository 的读写、归档、恢复和缺配置 fallback。
- 构建验证仍使用 `npm test`、`npm run build`，真实 CloudBase 连通性在用户提供环境信息后再执行。

## Spec Patch

已回写：补充“前端直连模式不得使用服务端密钥”“前端只接受 Publishable Key 或无密钥初始化配置”“CloudBase Web SDK 需要配置安全域名/权限规则”的验收边界。
