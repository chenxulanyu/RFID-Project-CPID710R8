# Brainstorm Summary

- Change: timeline-pdf-export-v1-3
- Date: 2026-06-22

## 确认的技术方案

方案 A — 工具函数 + 页面集成：

- 创建 `utils/exportPdf.ts`，导出 `exportDashboardToPdf()` 纯函数
- DashboardPage.tsx 新增 `isExporting` 状态
- 按钮放置在 ProjectTimeline 底部左下角，点击调用工具函数
- 导出流程：隐藏按钮 → html2canvas 捕获（scale=2）→ jsPDF 生成 A4 宽 × 自适应高 PDF → 恢复按钮 → 自动下载

## 关键取舍与风险

- **取舍**：不在 PDF 中引入按钮（导出前隐藏，导出后恢复），比 @media print 更可靠
- **风险**：html2canvas 渲染精度 — 通过 scale=2 缓解；新增依赖体积 ~80KB gzip — 可接受
- **文件命名**：固定 `项目仪表盘-CPID710R8-{YYYYMMDD}.pdf`

## 测试策略

- 单元测试：Mock html2canvas/jsPDF，验证尺寸计算、按钮 class 切换
- 集成测试：验证按钮三种状态（加载中/错误/正常）及生成中状态
- 运行 `npx vitest run` + `npm run build`

## Spec Patch

无。OpenSpec delta spec 与设计方案一致，无需回写。
