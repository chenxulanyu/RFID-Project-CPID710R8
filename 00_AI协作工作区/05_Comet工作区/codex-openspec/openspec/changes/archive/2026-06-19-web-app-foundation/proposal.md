## Why

现有 `CPID710R8_项目进度管理.xlsx` 已具备项目进度跟踪、预警和甘特图能力，但它仍是单机 Excel 文件，不利于后续前后端网站化、云端持久化和移动端展示。先建立网站工程基础，可以把 Excel 中已经验证过的数据结构沉淀为可扩展的数据模型，为展示端、管理端、CloudBase 持久化和部署工作提供共同底座。

## What Changes

- 创建项目网站的基础工程结构，包含前端应用入口、路由、基础布局和本地开发启动方式。
- 建立项目进度管理的核心领域模型，覆盖项目、里程碑/任务、计划日期、实际日期、完成比例、预警、责任人、资源方和备注。
- 提供从当前 Excel 内容抽象出的首版 mock 数据，用于无云密钥条件下的前后端开发和验收。
- 建立数据访问抽象层，使后续可以从 mock 数据平滑切换到管理端接口和 CloudBase。
- 明确本 change 只负责基础骨架，不实现完整仪表盘、不实现后台维护功能、不接入真实 CloudBase、不处理 GitHub/Gitee 推送和扣子部署。

## Capabilities

### New Capabilities
- `project-web-foundation`: 网站基础工程、项目进度数据模型、mock 数据源和数据访问抽象。

### Modified Capabilities
- 无。

## Impact

- 新增前后端网站项目结构和基础开发命令。
- 新增项目进度领域模型与 mock 数据文件。
- 后续 `project-dashboard-frontend`、`admin-progress-backend`、`cloudbase-persistence` 和 `repository-and-deployment` changes 将依赖此基础。
- 不修改现有 IPD 阶段目录和原始 Excel 文件。
