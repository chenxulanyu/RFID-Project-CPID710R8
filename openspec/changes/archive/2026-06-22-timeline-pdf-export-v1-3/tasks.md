## 1. 依赖安装

- [x] 1.1 安装 html2canvas 和 jsPDF 依赖到 web/package.json

## 2. PDF 导出核心逻辑

- [x] 2.1 创建 `web/src/utils/exportPdf.ts`，实现 `exportDashboardToPdf()` 函数
- [x] 2.2 实现 .dashboard-page DOM 捕获（html2canvas，scale=2）
- [x] 2.3 实现 PDF 生成（jsPDF，A4 宽度 210mm，高度自适应，单页连续）
- [x] 2.4 实现导出前隐藏按钮、导出后恢复按钮的逻辑
- [x] 2.5 实现文件命名：项目仪表盘-CPID710R8-{YYYYMMDD}.pdf

## 3. UI 集成

- [x] 3.1 在 DashboardPage.tsx 的 ProjectTimeline 底部左下角添加「导出PDF」按钮
- [x] 3.2 实现按钮状态管理：加载中禁用、错误禁用、生成中显示「生成中…」
- [x] 3.3 在 styles.css 中添加按钮样式

## 4. 测试与验证

- [x] 4.1 为 exportPdf 工具函数添加单元测试
- [x] 4.2 为 DashboardPage 按钮状态添加集成测试
- [x] 4.3 运行完整测试套件（npx vitest run）
- [x] 4.4 运行完整构建（npm run build）
<!-- review skipped: no subagent dispatch capability available -->
