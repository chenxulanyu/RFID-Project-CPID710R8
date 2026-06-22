## Why

项目仪表盘页面（DashboardPage）是团队日常查看项目进度的核心视图。当前页面仅能在浏览器中查看，无法保存或分享为离线文档。用户需要一个「导出 PDF」功能，将当前仪表盘内容以 A4 宽度的连续 PDF 格式导出，便于打印、存档和分享。

## What Changes

- 在 Dashboard 页面的时间轴区块左下角新增「导出PDF」按钮
- 点击按钮后捕获整个仪表盘页面内容（.dashboard-page），生成 A4 宽度、高度自适应、不分页的连续 PDF 文档
- PDF 中不包含「导出PDF」按钮本身
- 数据加载中或加载失败时按钮禁用
- 新增依赖：html2canvas + jsPDF

## Capabilities

### New Capabilities
- `dashboard-pdf-export`: 将 Dashboard 页面导出为 A4 宽度的连续 PDF 文档
  - 捕获 .dashboard-page DOM 内容为 Canvas 截图
  - 生成 A4 宽度（210mm）、高度自适应、不分页的单页 PDF
  - 按钮状态管理（加载中/错误时禁用）

### Modified Capabilities
<!-- 本次不修改已有 capability -->

## Impact

- `web/package.json`: 新增 html2canvas、jsPDF 依赖
- `web/src/features/project/DashboardPage.tsx`: 新增导出按钮及导出逻辑
- `web/src/styles.css`: 新增按钮样式、@media print 隐藏规则（按钮在 PDF 中不可见）
