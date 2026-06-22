---
comet_change: timeline-pdf-export-v1-3
role: technical-design
canonical_spec: openspec
archived-with: 2026-06-22-timeline-pdf-export-v1-3
status: final
---

# 技术设计：Dashboard PDF 导出

## 架构

```
DashboardPage.tsx                    utils/exportPdf.ts
┌─────────────────────┐             ┌──────────────────────────┐
│ isExporting: boolean │──click────▶│ exportDashboardToPdf()   │
│ model: Model | null  │             │                          │
│ error: boolean       │             │ 1. 隐藏按钮 (hidden cls) │
│                      │             │ 2. html2canvas (scale=2) │
│ <button>导出PDF</btn>│             │ 3. jsPDF 生成            │
│                      │    ◀───────│ 4. 恢复按钮              │
│ disabled/immediate   │   promise  │ 5. .save(filename)       │
└─────────────────────┘             └──────────────────────────┘
```

- **`utils/exportPdf.ts`**：纯工具模块，无 React 依赖。导出 `exportDashboardToPdf()` async 函数
- **`DashboardPage.tsx`**：新增 `isExporting` 状态，管理按钮 disabled/text 切换

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `web/package.json` | 修改 | 新增 `html2canvas`、`jspdf` 依赖 |
| `web/src/utils/exportPdf.ts` | 新建 | PDF 导出核心逻辑 |
| `web/src/features/project/DashboardPage.tsx` | 修改 | 集成按钮 + isExporting 状态 |
| `web/src/styles.css` | 修改 | 按钮样式（.export-pdf-btn, .export-pdf-btn--hidden） |
| `web/src/utils/exportPdf.test.ts` | 新建 | 单元测试 |
| `web/src/features/project/DashboardPage.test.tsx` | 修改 | 补充按钮状态测试 |

## 核心函数签名

```typescript
// utils/exportPdf.ts

/** 将当前 Dashboard 页面导出为 A4 宽度的连续 PDF */
export async function exportDashboardToPdf(): Promise<void>;
```

内部步骤：
1. `document.querySelector('.dashboard-page')` → 找不到抛错
2. `button.classList.add('export-pdf-btn--hidden')`
3. `await html2canvas(dashboardEl, { scale: 2, useCORS: true })`
4. `button.classList.remove('export-pdf-btn--hidden')`
5. `const pdfW = 210; const pdfH = pdfW * (canvas.height / canvas.width)`
6. `new jsPDF({ unit: 'mm', format: [pdfW, pdfH] })`
7. `pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, pdfH)`
8. `pdf.save(\`项目仪表盘-CPID710R8-${getDateString()}.pdf\`)`

## 按钮状态表

| model | error | isExporting | disabled | 按钮文字 |
|-------|-------|-------------|----------|---------|
| null | false | false | ✅ | 导出PDF |
| null | false | true | ✅ | 生成中… |
| object | false | false | ❌ | 导出PDF |
| object | false | true | ✅ | 生成中… |
| null | true | false | ✅ | 导出PDF |

## 样式设计

```css
.export-pdf-btn {
  align-self: flex-start;
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.export-pdf-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-pdf-btn--hidden {
  visibility: hidden;
}
```

## 测试要点

### exportPdf.test.ts
- Mock `html2canvas` 返回已知尺寸 Canvas（如 1200×2400）
- 验证 jsPDF 实例使用正确尺寸：`format: [210, 420]`
- 验证 `pdf.save()` 被调用且文件名包含日期格式
- 验证按钮 class 在导出前后正确切换
- 验证 `.dashboard-page` 不存在时抛出可捕获错误

### DashboardPage.test.tsx
- 数据加载中：按钮 `disabled`
- 数据加载失败：按钮 `disabled`
- 数据加载成功：按钮 `enabled`，点击后文字变为「生成中…」
- 导出完成后按钮恢复「导出PDF」
