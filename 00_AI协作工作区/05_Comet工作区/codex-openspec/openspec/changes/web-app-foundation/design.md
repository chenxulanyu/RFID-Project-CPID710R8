## Context

当前项目的进度管理能力沉淀在 `03_开发阶段/CPID710R8_项目进度管理.xlsx` 中。该工作簿包含项目周期、任务计划、实际进度、工期计算、完成比例、预警和甘特图展示逻辑。网站化改造需要先建立统一工程基础和领域模型，后续展示端、管理端、CloudBase 持久化与部署才能围绕同一数据契约推进。

约束包括：遵守双 AI 协作流程，新增 AI 协作产物优先放入 `00_AI协作工作区/`；Comet/OpenSpec 仅使用 Codex 专用工作区；本 change 不依赖腾讯云账号密钥。

## Goals / Non-Goals

**Goals:**
- 建立可本地运行的网站项目基础，支持后续前端展示、管理端和数据持久化扩展。
- 定义项目进度领域模型，使 Excel 字段可以映射为结构化数据。
- 提供 mock 数据源，确保没有 CloudBase 配置时也能开发和验证。
- 建立数据访问抽象，后续可替换为后端 API 或 CloudBase 适配器。

**Non-Goals:**
- 不实现完整仪表盘、甘特图或移动端横屏交互。
- 不实现管理端登录、权限、任务编辑表单。
- 不接入真实 CloudBase 环境或保存密钥。
- 不执行 GitHub/Gitee 推送或扣子部署。

## Decisions

1. **以项目进度领域模型作为前后端契约**
   - 选择：先定义 `Project`、`ProjectTask`、`ProgressMetrics`、`WarningState` 等核心结构。
   - 理由：Excel 已经证明这些字段是业务核心，前端展示、后端维护和 CloudBase 存储都需要共享语义。
   - 替代方案：直接按 Excel 行列渲染。该方案短期快，但会使后续后台编辑、云端查询和仪表盘聚合变得脆弱。

2. **以 mock 数据作为首个数据源**
   - 选择：从现有 Excel 抽取或手工整理首版 mock 数据，作为本地开发默认数据。
   - 理由：用户后续才提供 CloudBase 账号密钥，基础工程不能被云环境阻塞。
   - 替代方案：一开始接 CloudBase。该方案会把基础工程和云配置耦合，增加初期不确定性。

3. **数据访问通过仓储/服务抽象暴露**
   - 选择：前端页面通过统一数据服务获取项目和任务，不直接读取具体 mock 文件。
   - 理由：后续 `admin-progress-backend` 和 `cloudbase-persistence` 可以替换实现而不改展示层调用方式。
   - 替代方案：页面直接 import 数据。该方案简单但迁移成本高。

4. **基础工程只提供最小可运行体验**
   - 选择：本 change 只要求项目能启动并展示基础项目数据占位或简单列表。
   - 理由：仪表盘、后台和 CloudBase 均已拆为独立 changes，避免基础 change 范围膨胀。

## Risks / Trade-offs

- [Risk] Excel 中公式计算逻辑与网站字段语义不完全一致 → Mitigation: 在模型中区分输入字段和派生字段，后续实现时保留可测试计算函数。
- [Risk] 过早选择技术栈可能影响扣子部署 → Mitigation: 基础工程需记录技术栈选择理由，并在部署 change 中验证适配性。
- [Risk] mock 数据与后续 CloudBase schema 偏离 → Mitigation: mock 数据使用与领域模型一致的结构，CloudBase change 基于同一契约建模。
- [Risk] 多 change 并行时边界混淆 → Mitigation: 每个 change 的 proposal/spec/tasks 明确非目标和依赖顺序。
