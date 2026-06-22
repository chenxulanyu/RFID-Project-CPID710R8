## Context

DashboardPage 是项目仪表盘的核心页面，包含四个区块：ProjectSummaryDashboard、RiskTaskStrip、TaskDetailTable、ProjectTimeline。用户需要将整个页面导出为 PDF，用于离线分享和存档。当前项目无 PDF 导出能力，需从零引入客户端 PDF 生成方案。

## Goals / Non-Goals

**Goals:**
- 提供「导出PDF」按钮，将整个 .dashboard-page 内容导出为 PDF
- PDF 宽度固定为 A4（210mm），高度根据内容比例自动计算，不分页，连续文档
- PDF 布局与浏览器全屏显示一致
- 按钮仅在数据加载完成后可用

**Non-Goals:**
- 不实现服务端 PDF 渲染
- 不支持分页导出
- 不支持单独导出某个区块
- 不支持自定义 PDF 文件名（使用默认命名规则）

## Decisions

### 1. PDF 生成方案：html2canvas + jsPDF

| 方案 | 评估 |
|------|------|
| `window.print()` + CSS @media print | 浏览器原生打印，无法精确控制 A4 宽度，且强制分页 |
| **html2canvas + jsPDF** ✅ | canvas 截图后写入 PDF，可精确控制尺寸、不分页 |
| Puppeteer 服务端 | 需要 Node 服务端，增加运维复杂度 |

选择 html2canvas + jsPDF：轻量纯前端方案，精确控制 PDF 尺寸和分页行为。

### 2. 导出流程

```
用户点击按钮
  → 显示加载状态（按钮文字变为「生成中…」）
  → html2canvas 捕获 .dashboard-page 为 Canvas
  → 计算 PDF 尺寸：宽度 = 210mm，高度 = 210 × (canvas.height / canvas.width)
  → jsPDF 创建自定义尺寸 PDF，添加 Canvas 图像
  → PDF 自动下载（文件名：项目仪表盘-CPID710R8-{YYYYMMDD}.pdf）
  → 恢复按钮状态
```

### 3. 按钮位置

按钮放置在 ProjectTimeline 组件底部左下角，作为时间轴区块的 footer 元素。使用 `align-self: flex-start` 确保左对齐。

### 4. 按钮在 PDF 中隐藏

方案：导出前向按钮添加 `data-pdf-hidden` 类（对应 CSS `visibility: hidden`），导出完成后移除。避免 @media print 方案（因为不是走浏览器打印通道）。

### 5. 按钮状态管理

- **加载中**（model === null）：按钮 `disabled`，显示为灰色
- **加载失败**（error === true）：按钮 `disabled`，显示为灰色
- **正常状态**：按钮可用
- **生成中**：按钮 `disabled`，文字变为「生成中…」

## Risks / Trade-offs

- **[R] html2canvas 渲染精度**：某些 CSS 属性（如 backdrop-filter）可能无法完美还原 → 可通过 `scale: 2` 提高清晰度
- **[R] 大页面内存**：如果 Dashboard 内容很长，canvas 可能较大 → A4 宽度限制下 canvas 尺寸可控，预计 < 5MB
- **[R] 新增依赖体积**：html2canvas ~50KB gzip, jsPDF ~30KB gzip → 对首屏加载影响可接受
- **[R] 图片资源跨域**：如果页面包含跨域图片，html2canvas 可能失败 → 当前 Dashboard 无外部图片，风险低

## Open Questions

- 无。需求边界已明确，技术方案单一。
