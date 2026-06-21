# 设计

## 数据源

`readProjectDataSourceConfig` 在未显式指定 `VITE_PROJECT_DATA_SOURCE=local` 时使用 CloudBase 公开前端配置，避免扣子构建环境变量漏配导致退回本地存储。测试初始化仍通过 `VITE_PROJECT_DATA_SOURCE=local` 保持稳定。

## 数据合并

- `LocalProjectRepository` 识别旧 3 条种子快照，并升级为 31 条完整种子加本地覆盖。
- `CloudBaseProjectRepository` 过滤旧结构/无效文档，并以 31 条完整种子为基线合并 CloudBase 中同 ID 任务覆盖和新增任务。

## 移动端旋转

将 `LandscapeGate` 上移到 `App`，包住导航和路由页面。页面组件不再重复包裹 `LandscapeGate`。

## 验证

- CloudBase 默认配置测试。
- CloudBase 任务覆盖合并测试。
- localStorage 旧 3 条快照升级测试。
- App 顶部导航位于 `.landscape-shell` 内的测试。
