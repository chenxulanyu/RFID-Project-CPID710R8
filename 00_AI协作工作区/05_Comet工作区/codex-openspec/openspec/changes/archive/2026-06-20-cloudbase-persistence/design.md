## Context

项目网站最终需要由用户维护数据并存储在腾讯云 CloudBase。当前基础工程和后台维护能力可以先基于 mock/local repository 运转，但进入真实协作和部署前，需要 CloudBase 作为统一持久化来源。

用户后续才会提供 CloudBase 账号、密钥和环境信息；这些凭证不得写入仓库、OpenSpec 文档或普通版本记录。

## Goals / Non-Goals

**Goals:**
- 定义 CloudBase 数据集合和文档结构，使其能保存项目和任务进度数据。
- 提供 CloudBase repository 适配器，实现与既有服务契约兼容的读写。
- 提供环境变量和部署配置说明，避免密钥硬编码。
- 支持从 mock/local 数据切换到 CloudBase 数据源。

**Non-Goals:**
- 不在文档或代码中记录真实账号密钥。
- 不实现前端展示组件或后台表单。
- 不执行最终生产部署。
- 不决定复杂权限策略，除非用户后续确认 CloudBase 访问模式。

## Decisions

1. **CloudBase 作为 repository 实现，而不是直接侵入业务组件**
   - 选择：CloudBase 适配器实现后台服务约定的读写接口。
   - 理由：展示端和管理端不用关心存储细节。
   - 替代方案：组件直接调用 CloudBase SDK。该方案耦合高，也增加凭证暴露风险。

2. **数据集合以项目和任务为核心**
   - 选择：至少包含项目元数据集合和任务集合，任务通过项目 ID 关联。
   - 理由：便于后续支持任务查询、更新和潜在多项目扩展。
   - 替代方案：单文档保存全部项目数据。该方案简单，但任务级更新和查询不够灵活。

3. **凭证只通过环境变量或部署平台密钥配置注入**
   - 选择：使用 `.env.example` 或部署说明记录变量名，不记录真实值。
   - 理由：符合安全边界，也方便 GitHub/Gitee 公开或半公开仓库管理。
   - 替代方案：本地配置文件保存真实值。该方案容易误提交。

4. **保留 mock fallback**
   - 选择：CloudBase 配置缺失时应用仍可使用 mock/local 数据。
   - 理由：开发、审查和演示不应被云凭证阻塞。

## Risks / Trade-offs

- [Risk] CloudBase 权限模型未确认 → Mitigation: 在实现前等待用户确认访问方式，首版只设计适配边界。
- [Risk] 云端数据结构与本地模型漂移 → Mitigation: 使用领域模型作为 schema 来源，并添加读写转换测试。
- [Risk] 密钥误提交 → Mitigation: 只提交 `.env.example`，真实 `.env` 加入忽略规则并在文档中警示。
- [Risk] 网络或云服务不可用影响展示 → Mitigation: 保留 mock/local fallback 或错误提示策略。
