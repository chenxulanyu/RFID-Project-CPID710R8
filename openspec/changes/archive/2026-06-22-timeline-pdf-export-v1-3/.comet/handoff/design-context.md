# Comet Design Handoff

- Change: timeline-pdf-export-v1-3
- Phase: design
- Mode: compact
- Context hash: 6c6e7d517a456fd7ecfc0114a9fa28c3a664516bc52911cd663abd537ea7dcae

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/timeline-pdf-export-v1-3/proposal.md

- Source: openspec/changes/timeline-pdf-export-v1-3/proposal.md
- Lines: 1-28
- SHA256: 0be6c891d55ab8e10d2864d45c30a5b3e61c907965cc8346e3feb123cce4d058

```md
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
```

## openspec/changes/timeline-pdf-export-v1-3/design.md

- Source: openspec/changes/timeline-pdf-export-v1-3/design.md
- Lines: 1-67
- SHA256: e72aa7e68500146e456d4b063f2c4abd73fed842a5a500ee537c7b0b48101173

```md
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
```

## openspec/changes/timeline-pdf-export-v1-3/tasks.md

- Source: openspec/changes/timeline-pdf-export-v1-3/tasks.md
- Lines: 1-24
- SHA256: 8ff85074a3bcbf5b4f7452bda7648ea1ad693e23e42c7cd5552280a2383c51a2

```md
## 1. 依赖安装

- [ ] 1.1 安装 html2canvas 和 jsPDF 依赖到 web/package.json

## 2. PDF 导出核心逻辑

- [ ] 2.1 创建 `web/src/utils/exportPdf.ts`，实现 `exportDashboardToPdf()` 函数
- [ ] 2.2 实现 .dashboard-page DOM 捕获（html2canvas，scale=2）
- [ ] 2.3 实现 PDF 生成（jsPDF，A4 宽度 210mm，高度自适应，单页连续）
- [ ] 2.4 实现导出前隐藏按钮、导出后恢复按钮的逻辑
- [ ] 2.5 实现文件命名：项目仪表盘-CPID710R8-{YYYYMMDD}.pdf

## 3. UI 集成

- [ ] 3.1 在 DashboardPage.tsx 的 ProjectTimeline 底部左下角添加「导出PDF」按钮
- [ ] 3.2 实现按钮状态管理：加载中禁用、错误禁用、生成中显示「生成中…」
- [ ] 3.3 在 styles.css 中添加按钮样式

## 4. 测试与验证

- [ ] 4.1 为 exportPdf 工具函数添加单元测试
- [ ] 4.2 为 DashboardPage 按钮状态添加集成测试
- [ ] 4.3 运行完整测试套件（npx vitest run）
- [ ] 4.4 运行完整构建（npm run build）
```

## openspec/changes/timeline-pdf-export-v1-3/specs/dashboard-pdf-export/spec.md

- Source: openspec/changes/timeline-pdf-export-v1-3/specs/dashboard-pdf-export/spec.md
- Lines: 1-30
- SHA256: cb20eb65426dbf5a4dce2f5a892249fea82913b8ce0a787aac310f936af59a4e

```md
## ADDED Requirements

### Requirement: Dashboard page export to PDF
The system SHALL provide a PDF export feature for the Dashboard page (.dashboard-page). The exported PDF SHALL use A4 width (210mm), adaptive height proportional to content, and SHALL be rendered as a single continuous page without pagination. The PDF layout SHALL match the browser full-screen display.

#### Scenario: Successful PDF export
- **WHEN** user clicks "导出PDF" button on a fully loaded Dashboard page
- **THEN** the system captures .dashboard-page content, generates a PDF with A4 width and proportional height, and triggers a file download named "项目仪表盘-CPID710R8-{YYYYMMDD}.pdf"

#### Scenario: Export button hidden in PDF
- **WHEN** the PDF is generated
- **THEN** the "导出PDF" button itself SHALL NOT appear in the exported PDF

### Requirement: Export button disabled during loading or error
The system SHALL disable the "导出PDF" button when the Dashboard data is still loading (model === null) or when a loading error has occurred (error === true).

#### Scenario: Button disabled during loading
- **WHEN** Dashboard data is loading (model === null)
- **THEN** the "导出PDF" button SHALL be in disabled state

#### Scenario: Button disabled on error
- **WHEN** Dashboard data loading failed (error === true)
- **THEN** the "导出PDF" button SHALL be in disabled state

### Requirement: Export button placement
The system SHALL place the "导出PDF" button at the bottom-left corner within the ProjectTimeline section.

#### Scenario: Button visibility after data loaded
- **WHEN** Dashboard data has loaded successfully
- **THEN** the "导出PDF" button SHALL be visible and enabled at the bottom-left of the ProjectTimeline section
```

