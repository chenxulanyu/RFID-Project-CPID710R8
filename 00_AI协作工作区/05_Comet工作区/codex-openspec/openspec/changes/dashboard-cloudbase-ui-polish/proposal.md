## Why

v1.1 后台维护允许资源方和责任人为空，但前台读取层仍按旧规则把这两个字段视为必填，导致新增任务虽然保存到 CloudBase，项目仪表盘刷新后仍可能回退到默认种子数据。与此同时，新增的未启动指标让仪表盘换行，时间轴双条形缺少图示且仍显示百分比，后台项目信息面板出现异常拉伸，影响部署后的日常维护和展示。

## What Changes

- 修复前台项目数据读取规则，使资源方和责任人为空的有效 CloudBase 任务仍可进入项目仪表盘、风险任务、任务详情和时间轴。
- 调整仪表盘 KPI 卡片为单行自适应宽度布局，并把延期/临期、延迟启动放到任务总数后面。
- 为计划时间轴增加蓝色计划周期、红色实际周期图示，并移除条形内部百分比文本。
- 修复后台维护项目信息面板高度异常拉伸，使任务详情紧跟项目信息区域。
- 保持 CloudBase 配置、扣子部署配置、Git 远程配置不变。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `project-dashboard-display`: 更新仪表盘 KPI 布局、时间轴双条形图示和百分比显示规则。
- `admin-progress-management`: 更新后台维护表单布局要求，避免项目信息面板异常占用垂直空间。
- `cloudbase-project-persistence`: 更新前台读取 CloudBase 任务时的有效性规则，资源方和责任人为空不应触发默认数据回退。

## Impact

- 影响前台展示组件：`ProjectSummaryDashboard.tsx`、`ProjectTimeline.tsx`、相关样式和测试。
- 影响数据读取服务：`projectService.ts` 及其测试。
- 影响后台维护布局样式：`styles.css`，必要时补充 Admin 页面布局测试。
- 不引入新依赖，不修改 CloudBase 环境、集合名、访问密钥或扣子部署配置。
