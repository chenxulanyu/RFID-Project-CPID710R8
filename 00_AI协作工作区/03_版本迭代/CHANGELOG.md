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

## repository-and-deployment v1.2 - 2026-06-20

- 接入真实 CloudBase 前端环境变量后，修复 Vitest 受本地 `.env.local` 影响而切换到 CloudBase 数据源的问题；测试初始化固定使用本地示例数据源，生产构建和扣子部署仍按环境变量选择数据源。
- 说明：本地无法加入 CloudBase 安全域名时，浏览器本地访问 CloudBase 失败属于预期限制；最终 CloudBase 连通性应在已加入安全域名的扣子部署域名上验证。
- 验证：`npm test` 通过，10 个测试文件、49 条测试用例通过。
- 验证：`npm run build` 通过，仍仅有 Vite chunk size 非阻断提示。
- 验证：`openspec validate --specs --strict` 通过，5 个主 spec 全部通过。

## repository-and-deployment v1.3 - 2026-06-20

- 修复扣子部署沙箱提示 `.coze configuration file not found in /workspace/projects` 的问题；在仓库根目录新增 `.coze`，让扣子从仓库根目录进入 `web/` 完成安装、构建和运行。
- 更新部署说明：扣子部署根目录应使用仓库根目录，由 `.coze` 内的 dev/deploy 命令负责 `cd web`。
- 验证：`npm test` 通过，10 个测试文件、49 条测试用例通过。
- 验证：`npm run build` 通过，仍仅有 Vite chunk size 非阻断提示。
- 验证：按 `.coze` 的部署构建等价命令 `cd web && npm install && npm run build` 通过。
- 验证：`openspec validate --specs --strict` 通过，5 个主 spec 全部通过。

## repository-and-deployment v1.4 - 2026-06-20

- 修复扣子 runtime 打包阶段在仓库根目录执行 `npm install` 时找不到 `package.json` 的问题；新增根目录空壳 `package.json`，通过 npm workspace 指向 `web/`。
- 调整 `.coze` 构建命令：先在仓库根目录执行 `npm install`，再进入 `web/` 执行 Vite 构建。
- 更新部署说明，补充根目录 `package.json` 是扣子 runtime 打包阶段的入口适配文件。
- 新增根目录 `package-lock.json`，锁定扣子根目录 workspace 安装解析结果。
- 验证：根目录 `npm install` 通过。
- 验证：`npm test` 通过，10 个测试文件、49 条测试用例通过。
- 验证：`npm run build` 通过，仍仅有 Vite chunk size 非阻断提示。
- 验证：按 `.coze` 的部署构建等价命令 `npm install && cd web && npm run build` 通过。
- 验证：`openspec validate --specs --strict` 通过，5 个主 spec 全部通过。

## repository-and-deployment v1.5 - 2026-06-20

- 修复扣子 `[build][runtime_pkg]` 阶段执行裸 `npm` 时受 npm 11.6.2 行为影响退出失败的问题；根目录 `package.json` 新增 `install`、`build`、`start` scripts，明确代理到 `web` workspace。
- 修复根目录 `install` 生命周期脚本递归触发 `npm install` 的风险；workspace 安装命令使用 `--ignore-scripts`，避免扣子 runtime 安装阶段重复进入根 install 生命周期。
- 根目录 `package.json` 新增 `engines`，声明 Node.js 与 npm 版本下限。
- 简化 `.coze` 命令为 `["npm", "run", "build"]` / `["npm", "run", "start", ...]`，避免 `sh -c` 解析差异。
- 说明：本修复仅调整部署配置层，未修改 `web/src/` 业务代码。
- 验证：根目录 `npm install` 通过，未再递归触发安装。
- 验证：根目录 `npm run build` 通过，代理到 `web` workspace 构建成功。
- 验证：根目录 `npm start` 可进入 Vite preview，并正确使用 `DEPLOY_RUN_PORT`。
- 验证：`npm test` 通过，10 个测试文件、49 条测试用例通过。
- 验证：`openspec validate --specs --strict` 通过，5 个主 spec 全部通过。

## seed-full-project-tasks v1.0 - 2026-06-20

- 修复默认项目任务种子数据只有 3 条样例的问题；按 Excel《CPID710R8_项目进度管理.xlsx》补齐 31 条进度明细。
- 保留 M1-M20 共 20 个里程碑关系；M5、M6、M7、M8、M9、M12 等里程碑下的多条明细任务以 `M*-001/002/003` 形式展开。
- 调整仪表盘 KPI 口径：任务总数按唯一里程碑编号统计为 20，同时在任务总数卡片补充显示明细条数。
- 增加前台数据保护：当 CloudBase `project_tasks` 返回旧结构或缺少必要任务字段时，自动回退到内置完整种子数据，避免线上继续显示不完整任务。
- 移动端竖屏不再显示“建议横屏查看”提示页，改为在网页内部旋转实际内容，以横屏布局展示。
- 新增 CloudBase `project_tasks` 导入数据文件：`00_AI协作工作区/02_需求与任务/seed-full-project-tasks/cloudbase-project_tasks-import.json`，包含 31 条明细、20 个里程碑。
- 说明：本修复未修改 `.coze`、根 `package.json`、`serve.mjs` 等扣子部署配置文件。

## fix-cloudbase-and-mobile-shell v1.0 - 2026-06-20

- 修复扣子部署环境未显式配置 CloudBase 变量时静默回退 `localStorage` 的问题；生产默认使用 CloudBase 公开前端配置，测试环境仍显式使用 local。
- 修复后台维护只在当前设备生效的问题：CloudBase 读取以 31 条内置任务为基线，叠加同 ID 远端覆盖和新增任务。
- 修复旧浏览器 `localStorage` 中 3 条任务快照覆盖新种子的问题；读取旧种子快照时自动升级为 31 条完整任务并保留本地覆盖。
- 修复手机竖屏旋转范围：将横屏旋转容器上移到 `App`，顶部“项目仪表盘 / 后台维护”导航和页面内容一起旋转。
- 新增回归测试覆盖 CloudBase 默认配置、CloudBase 合并覆盖、localStorage 旧快照升级和导航旋转容器范围。

## fix-cloudbase-persistence-and-admin-save v1.0 - 2026-06-20

- 修复 CloudBase 项目文档和任务文档的写入确认：保存后必须检查返回结果并回读校验，避免 SDK 错误体被误判为成功。
- 修复项目周期与时间轴异常：CloudBase 项目文档缺失计划周期字段时回退到种子默认值，避免前端显示 `undefined`。
- 修复后台保存交互：项目基础信息与当前任务详情通过单一保存动作一起提交，归档与恢复保持独立。
- 新增回归测试：CloudBase 缺字段回退、CloudBase 错误返回拒绝成功、统一保存按钮和联合保存流程。
- 验证：`npm test -- src/services/cloudbaseProjectRepository.test.ts src/features/project/AdminPage.test.tsx` 通过。
- 验证：`npm test` 通过，10 个测试文件、57 条测试用例通过。
- 验证：`npm run build` 通过。

## fix-cloudbase-persistence-and-admin-save v1.1 - 2026-06-20

- 修复 CloudBase 现有文档保存时仍用 `set` 导致 `_id` 重复键错误的问题；写入改为“存在则 `update`，不存在才 `set`”。
- 修复任务恢复时 `archivedAt` 残留导致回读校验失败的问题；恢复路径现在显式清空归档时间。
- 保持任务创建、更新、归档与恢复流程不变，并补充回归测试覆盖已有文档更新与恢复清理。
- 验证：`npm test -- src/services/cloudbaseProjectRepository.test.ts src/features/project/AdminPage.test.tsx src/services/projectAdminService.test.ts` 通过。
