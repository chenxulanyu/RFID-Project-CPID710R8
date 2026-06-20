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

## web-app-foundation v1.1 - 2026-06-19

- 处理 Claude Code `Claude审查-v1.0.md` 的有条件通过意见。
- 修复基础展示页默认使用固定日期导致逾期、临期和完成比例长期停留在 2026-06-19 的问题；页面加载时显式传入当前日期。
- 修复倒序日期导致 `calculateCalendarDays` 返回负数的问题，防止未来误填实际开始日期时派生出负数 `elapsedDays`。
- 调整 1 天未完成任务当天的完成比例口径，避免未完成任务直接显示 99%。
- 记录完成比例显示口径：未完成且未逾期任务仅按耗时比例估算进度，显示上限为 95%；已完成任务显示 100%，超期未完成任务显示 99%。
- 新增回归测试：当前日期注入、倒序日期防御、1 天任务完成比例边界。
- 验证：`npm test` 通过，4 个测试文件、11 条测试用例通过。
- 验证：`npm run build` 通过。
- 可再次交给 Claude Code 审查：是。

## project-dashboard-frontend v1.0 - 2026-06-19

- 新增 CPID710R8 项目总览仪表盘，包含项目周期、当前日期、关键 KPI、风险任务条、任务明细表和计划时间轴。
- 新增 `dashboardStatus` 派生状态，兼容原有 `elapsedDays` 字段，并区分已完成、进行中、延迟启动和未开始任务。
- 新增计划时间轴，以计划起止日期呈现任务跨度，并用状态/风险颜色表达完成、进行、延迟和未开始状态。
- 新增移动端竖屏横屏提示；手机竖屏隐藏完整仪表盘，手机横屏保留完整仪表盘并让高密度表格、时间轴在自身容器内横向滚动。
- 加强文字和框体溢出控制：KPI、风险条、状态标签、明细表和时间轴均使用稳定尺寸、截断或横向滚动，避免移动端文字与框体重叠。
- 新增回归测试：仪表盘 KPI、风险任务、任务明细、计划时间轴、移动端横屏提示。
- 验证：`npm test` 通过，6 个测试文件、17 条测试用例通过。
- 验证：`npm run build` 通过。
- 视觉验证：桌面 `1440x900`、手机横屏 `844x390`、手机竖屏 `390x844` 均无页面级横向溢出；手机竖屏仅显示横屏提示。
- 可交给 Claude Code 审查：是。

## project-dashboard-frontend v1.1 - 2026-06-19

- 处理 Codex standard code review gate 反馈：3 条 Important 和 1 条 Minor 均采纳。
- 修复 `dashboardStatus` 对旧 `elapsedDays` 数据的兼容：`finished` 保持已完成，数字型已耗时任务保持进行中。
- 修复计划时间轴当前日期标记写死位置的问题，改为根据项目周期和当前日期派生 `todayPercent`。
- 修复默认当前日期使用 UTC 口径的问题，改为基于浏览器本地日期字段生成 `YYYY-MM-DD`。
- 新增项目数据加载失败提示，并在组件卸载或日期切换时避免过期异步更新。
- 新增回归测试：旧 `elapsedDays` 状态兼容、时间轴当前日期位置、本地日期格式化、加载失败提示。
- 处理 Codex 复审反馈：将时间轴当前日期标记定位修正为相对任务轨道起点，而非相对整体时间轴容器。

## project-dashboard-frontend v1.2 - 2026-06-19

- 处理 Claude Code `Claude审查-project-dashboard-frontend-v1.1.md` 的有条件通过意见。
- 修复时间轴当前日期标记的 CSS 百分比基准：新增与任务行同网格的 `timeline-today-track`，使 marker 的 `left: <todayPercent>%` 相对任务轨道宽度定位。
- 修复 `getDashboardStatus` 的防御性优先级：`actualEndDate` / `actualStartDate` 优先于 legacy `elapsedDays` fallback，避免不一致导入数据把已完成任务误判为进行中。
- 增强当前日期 marker 可见性：增加白色边框，使其在深色任务条上保持清晰。
- 新增回归测试：不一致任务数据下 actual dates 优先，以及当前日期 marker 必须定位在任务轨道容器内。

## admin-progress-backend v1.0 - 2026-06-20

- 新增后台进度维护页 `/admin`，支持项目基础信息编辑、任务新增、任务更新、软归档和恢复。
- 新增项目维护服务与验证模块，覆盖必填字段、计划/实际日期顺序、任务 ID 重复和手动完成比例边界。
- 新增可替换 repository 合约；首版使用浏览器 `localStorage` 持久化，测试场景保留纯内存 snapshot adapter，后续可替换 CloudBase adapter。
- 公共仪表盘读取默认隐藏已归档任务，后台读取包含已归档任务；实际结束日期优先于手动完成比例，已完成任务显示 100%。
- 后台页复用移动端横屏提示，并为表单、任务列表、按钮和消息区域增加换行、截断或滚动约束，降低文字和框体溢出风险。
- 验证：`npm test` 通过，8 个测试文件、38 条测试用例通过。
- 可交给 Claude Code 审查：是。

## admin-progress-backend v1.1 - 2026-06-20

- 处理 Claude Code `Claude审查-admin-progress-backend-v1.0.md` 的有条件通过意见。
- 修复 `/admin` 路由归档任务时 `archivedAt` 固定为 `2026-06-19` 的问题；后台入口改为注入浏览器本地当前日期。
- 新增回归测试：模拟 2026-06-20 从 `/admin` 归档任务时，`localStorage` 中对应任务的 `archivedAt` 必须写入 `2026-06-20`。
- 采纳命名建议：将默认读取用 repository 从 `MockProjectRepository` 重命名为 `DefaultProjectRepository`，避免误导为纯测试替身。
- 暂不处理非阻断 UX 建议：完成日期与手动进度同时填写的提示、异步保存 loading 状态，留待后续交互优化 change。
- 验证：`npm test` 通过，8 个测试文件、39 条测试用例通过。
- 验证：`npm run build` 通过。
- 验证：`openspec validate admin-progress-backend --strict` 通过。

## cloudbase-persistence v1.0 - 2026-06-20

- 新增 CloudBase 项目进度持久化设计和实施计划，确认采用前端直连 CloudBase Web SDK 的静态部署路径。
- 新增 `CloudBaseProjectRepository`，通过现有 `ProjectRepository` 契约读写项目元数据和任务进度数据。
- 新增数据源工厂，支持 `local` 与 `cloudbase` 模式切换；CloudBase 配置缺失时保留本地/mock fallback。
- 新增前端配置安全边界：仅允许环境 ID、Publishable Key、项目 ID 和集合名等 Web SDK 公开配置，显式拒绝 `secretId` / `secretKey` 等服务端密钥进入前端配置。
- 新增 `web/.env.example` 与 CloudBase 配置说明，记录安全域名/允许来源、认证方式和数据库权限规则等上线前要求。
- 真实 CloudBase 读写连通性验证待用户提供 CloudBase 环境信息后执行。

## repository-and-deployment v1.0 - 2026-06-20

- 新增仓库根 `README.md`，说明项目目的、目录结构、本地开发、验证命令、主要页面、CloudBase 数据源边界和双 AI 协作入口。
- 新增 `docs/deployment.md`，记录 GitHub/Gitee 发布准备、扣子手动部署建议、CloudBase 前端安全环境变量、上线前 CloudBase 配置和外部操作授权边界。
- 新增 `docs/release-readiness-checklist.md`，覆盖本地状态、构建测试、页面检查、CloudBase 连通、敏感信息、仓库/部署授权和发布记录。
- 确认 `.gitignore` 已排除 `.env`、`.env.*`、`node_modules/`、`dist/`、`.DS_Store` 与 `.superpowers/`，并保留 `!.env.example`。
- 验证：敏感字段扫描仅命中禁止提交 `secretId` / `secretKey` 的测试或文档说明，未发现真实凭证。
- 扣子部署由用户手动执行；真实线上部署验证结果待部署完成后补记。

## repository-and-deployment v1.1 - 2026-06-20

- 处理 Claude Code `Claude审查-repository-and-deployment-v1.0.md` 的有条件通过意见。
- 修正 `README.md`、`docs/deployment.md`、`docs/release-readiness-checklist.md` 和 `web/README.md` 中的路由描述：删除不存在的 `/dashboard` 引用，将 `/` 明确为项目进度仪表盘。
- 在根 `README.md` 目录结构中补充 `docs/`，覆盖新增部署说明和发布检查清单目录。
- 新增 `Codex审查回应-repository-and-deployment-v1.0.md`，逐条记录 I1、M1 均采纳。
- 验证：`npm test` 通过，10 个测试文件、49 条测试用例通过。
- 验证：`npm run build` 通过，仍仅有 Vite chunk size 非阻断提示。
