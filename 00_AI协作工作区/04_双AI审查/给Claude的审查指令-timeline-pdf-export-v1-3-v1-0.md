# Claude Code 审查指令

**Change**: `timeline-pdf-export-v1-3`
**版本**: v1.0（首次审查）
**日期**: 2026-06-22
**审查类型**: 只读代码审查

---

## 一、改动汇总

为 Dashboard 页面（项目仪表盘）新增「导出 PDF」功能。

| 文件 | 操作 | 说明 |
|------|------|------|
| `web/package.json` | 修改 | 新增 `html2canvas` + `jsPDF` 依赖 |
| `web/src/utils/exportPdf.ts` | 新建 | PDF 导出核心逻辑（35 行） |
| `web/src/utils/exportPdf.test.ts` | 新建 | 4 个单元测试（68 行） |
| `web/src/features/project/DashboardPage.tsx` | 修改 | 集成导出按钮和 `isExporting` 状态 |
| `web/src/features/project/DashboardPage.test.tsx` | 修改 | +2 个按钮状态测试 |
| `web/src/styles.css` | 修改 | 按钮样式（27 行 CSS） |

**总计**：6 文件，+170 行，-1 行。

---

## 二、设计决策

1. **技术选型**：html2canvas + jsPDF（纯前端，无需服务端渲染）
2. **导出范围**：捕获 `.dashboard-page` 整页内容（4 个区块）
3. **PDF 规格**：A4 宽度 210mm，高度 `210 × (canvas.height / canvas.width)`，单页不分页
4. **按钮隐藏**：导出前 `classList.add('export-pdf-btn--hidden')`，`finally` 块中移除。不依赖 `@media print`（因为不走浏览器打印通道）
5. **按钮定位**：在 `DashboardPage.tsx` 中用 `flexDirection: column` wrapper 包裹 `ProjectTimeline` + 按钮，按钮 `align-self: flex-start`
6. **状态管理**：`isExporting` 控制按钮文字（「导出PDF」/「生成中…」）和 disabled 属性
7. **jsPDF 调用**：使用 `new jsPDF({ unit: 'mm', format: [210, h] })` 构造函数

---

## 三、审查重点

请重点关注以下方面：

### 正确性
- `exportDashboardToPdf()` 中的 `try/finally` 块是否确保按钮 class 必然恢复？
- `isExporting` 状态在异常路径（`handleExportPdf` catch 后）是否正确重置？
- PDF 尺寸计算：`pdfH = pdfW * (canvas.height / canvas.width)` 是否在所有浏览器中一致？

### 安全
- html2canvas 的 `useCORS: true` 选项是否引入跨域风险？（当前 Dashboard 无外部图片）
- jsPDF `addImage` 的 data URL 注入是否有 XSS 风险？
- HTML 转 Canvas 是否可能泄露页面中的敏感信息？

### 边界条件
- `.dashboard-page` 不存在时是否正确抛出 Error？
- 导出过程中用户快速连续点击按钮是否有竞态条件？
- 移动端导出是否正常？（jsPDF blob download 在移动端支持）

### 测试覆盖
- `exportPdf.test.ts` 的 mock 是否正确模拟了 `new jsPDF()` 的 constructor 行为？
- DashboardPage 按钮测试是否正确处理了异步数据加载（`vi.waitFor`）？
- 是否有遗漏的测试场景？

---

## 四、验证结果

| 检查项 | 状态 |
|--------|------|
| 构建（`npm run build`） | ✅ 通过 |
| TypeScript（`tsc --noEmit`） | ✅ 零错误 |
| 单元测试（`npx vitest run`） | ✅ 130/130 通过 |
| 文件一致性 | ✅ 与 tasks.md 一致 |

---

## 五、读取指引

请使用以下命令读取实现文件：

```bash
# 核心实现
cat openspec/changes/timeline-pdf-export-v1-3/specs/dashboard-pdf-export/spec.md
cat web/src/utils/exportPdf.ts

# 集成代码
cat web/src/features/project/DashboardPage.tsx

# 测试代码
cat web/src/utils/exportPdf.test.ts
cat web/src/features/project/DashboardPage.test.tsx

# 样式
grep -A 30 "export-pdf" web/src/styles.css
```

**审查产出**：请将审查报告保存至 `00_AI协作工作区/04_双AI审查/Claude审查报告-timeline-pdf-export-v1-3-v1-0.md`，结论标注 ✅通过 / ⚠️有条件通过 / ❌不通过。
