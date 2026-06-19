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
