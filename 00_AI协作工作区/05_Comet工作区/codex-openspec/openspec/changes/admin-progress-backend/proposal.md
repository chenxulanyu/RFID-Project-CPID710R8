## Why

前端展示端需要稳定读取项目数据，但项目内容和具体进度需要由用户在后端持续维护。如果没有独立的管理和后端读写能力，网站会停留在静态展示，无法替代 Excel 的日常维护作用。

## What Changes

- 增加项目进度维护能力，支持维护项目基本信息、任务计划、实际进度、完成比例相关输入、责任人、资源方和备注。
- 增加后端读写接口或服务层，为展示端提供统一的项目数据读取能力，并为管理端提供更新能力。
- 增加基础校验，避免结束日期早于开始日期、任务缺少必要字段、完成状态与实际日期明显冲突等问题。
- 预留后续 CloudBase 持久化适配点，但本 change 不接入真实 CloudBase 密钥和云环境。
- 本 change 不实现前端展示仪表盘、不处理 GitHub/Gitee 推送和扣子部署。

## Capabilities

### New Capabilities
- `admin-progress-management`: 项目进度后台维护能力，包括管理端数据编辑、后端读写接口和基础数据校验。

### Modified Capabilities
- 无。

## Impact

- 依赖 `web-app-foundation` 的领域模型和数据访问契约。
- 为 `project-dashboard-frontend` 提供可替换的真实数据来源。
- 为 `cloudbase-persistence` 提供后续云端持久化接入点。
- 可能新增后端路由、管理端页面、服务层、校验函数和测试。
