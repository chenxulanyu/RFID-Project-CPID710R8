---
change: timeline-pdf-export-v1-3
design-doc: docs/superpowers/specs/2026-06-22-timeline-pdf-export-v1-3-design.md
base-ref: 22d0199e7ff87f444246cbe0e6952a78a29f4c66
archived-with: 2026-06-22-timeline-pdf-export-v1-3
---

# Dashboard PDF 导出 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Dashboard 页面添加「导出PDF」按钮，将整个仪表盘导出为 A4 宽度、高度自适应、不分页的连续 PDF。

**Architecture:** 工具函数 `utils/exportPdf.ts` 负责 PDF 生成（html2canvas + jsPDF），DashboardPage.tsx 集成按钮和状态管理。按钮位于 ProjectTimeline 底部左下角。

**Tech Stack:** React + TypeScript, html2canvas, jsPDF, Vitest

archived-with: 2026-06-22-timeline-pdf-export-v1-3
---

## Task 1: 安装依赖

**Files:**
- Modify: `web/package.json`

 - [x] **Step 1: 添加 html2canvas 和 jsPDF**

```bash
cd web && npm install html2canvas jspdf
```

 - [x] **Step 2: 验证安装**

```bash
node -e "require('html2canvas'); require('jspdf'); console.log('OK')"
```
Expected: `OK`

archived-with: 2026-06-22-timeline-pdf-export-v1-3
---

## Task 2: 创建 exportPdf 工具函数

**Files:**
- Create: `web/src/utils/exportPdf.ts`

 - [x] **Step 1: 实现 exportDashboardToPdf 函数**

```typescript
// web/src/utils/exportPdf.ts
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function getDateString(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
}

const HIDDEN_CLASS = 'export-pdf-btn--hidden';

export async function exportDashboardToPdf(): Promise<void> {
  const dashboardEl = document.querySelector('.dashboard-page');
  if (!dashboardEl) {
    throw new Error('Dashboard page element not found');
  }

  const container = dashboardEl as HTMLElement;
  const btn = container.querySelector('.export-pdf-btn');
  btn?.classList.add(HIDDEN_CLASS);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const pdfW = 210; // A4 width in mm
    const pdfH = pdfW * (canvas.height / canvas.width);
    const pdf = new jsPDF({ unit: 'mm', format: [pdfW, pdfH] });
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`项目仪表盘-CPID710R8-${getDateString()}.pdf`);
  } finally {
    btn?.classList.remove(HIDDEN_CLASS);
  }
}
```

 - [x] **Step 2: 运行 TypeScript 编译验证**

```bash
cd web && npx tsc --noEmit
```
Expected: 0 errors (若 html2canvas/jsPDF 缺少类型声明，下一步处理)

archived-with: 2026-06-22-timeline-pdf-export-v1-3
---

## Task 3: 类型声明（如需要）

**Files:**
- Create: `web/src/types/html2canvas.d.ts` (如需要)

 - [x] **Step 1: 检查是否缺少类型**

```bash
cd web && npx tsc --noEmit 2>&1 | grep "html2canvas\|jspdf"
```

 - [x] **Step 2: 如有缺失，添加声明文件**

```typescript
// web/src/types/html2canvas.d.ts
declare module 'html2canvas' {
  interface Options {
    scale?: number;
    useCORS?: boolean;
  }
  export default function html2canvas(element: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
}
```

若 `jspdf` 也有类型问题，类似处理。

archived-with: 2026-06-22-timeline-pdf-export-v1-3
---

## Task 4: DashboardPage 集成按钮

**Files:**
- Modify: `web/src/features/project/DashboardPage.tsx`

 - [x] **Step 1: 添加 isExporting 状态和导入**

在文件顶部添加导入：
```typescript
import { exportDashboardToPdf } from '../../utils/exportPdf';
```

在 `DashboardPage` 组件内添加状态：
```typescript
const [isExporting, setIsExporting] = useState(false);
```

 - [x] **Step 2: 实现导出处理函数**

```typescript
const handleExportPdf = async () => {
  setIsExporting(true);
  try {
    await exportDashboardToPdf();
  } catch (err) {
    console.error('PDF export failed:', err);
  } finally {
    setIsExporting(false);
  }
};
```

 - [x] **Step 3: 修改 ProjectTimeline 区块，添加按钮**

将 `<ProjectTimeline model={model} />` 替换为：

```tsx
<div style={{ display: 'flex', flexDirection: 'column' }}>
  <ProjectTimeline model={model} />
  <button
    className="export-pdf-btn"
    disabled={isExporting}
    onClick={handleExportPdf}
  >
    {isExporting ? '生成中…' : '导出PDF'}
  </button>
</div>
```

注意：按钮的 `disabled` 只需要 `isExporting` 控制，因为 DashboardPage 已经在 model 未加载/error 时不渲染 `.dashboard-page` 内容（显示的是 loading/error 文案），此时按钮不会出现。

 - [x] **Step 4: 运行类型检查**

```bash
cd web && npx tsc --noEmit
```
Expected: 0 errors

archived-with: 2026-06-22-timeline-pdf-export-v1-3
---

## Task 5: 按钮样式

**Files:**
- Modify: `web/src/styles.css`

 - [x] **Step 1: 添加按钮样式**

```css
/* PDF 导出按钮 */
.export-pdf-btn {
  align-self: flex-start;
  margin-top: 12px;
  padding: 6px 16px;
  font-size: 13px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: 4px;
  background: var(--color-surface, #fff);
  color: var(--color-text, #101828);
  cursor: pointer;
  transition: opacity 0.15s;
}

.export-pdf-btn:hover:not(:disabled) {
  background: var(--color-surface-hover, #f5f5f5);
}

.export-pdf-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-pdf-btn--hidden {
  visibility: hidden;
}
```

archived-with: 2026-06-22-timeline-pdf-export-v1-3
---

## Task 6: exportPdf 单元测试

**Files:**
- Create: `web/src/utils/exportPdf.test.ts`

 - [x] **Step 1: 编写测试**

```typescript
// web/src/utils/exportPdf.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCanvas = {
  width: 1200,
  height: 2400,
  toDataURL: vi.fn().mockReturnValue('data:image/png;base64,xxx'),
} as unknown as HTMLCanvasElement;

const mockAddImage = vi.fn();
const mockSave = vi.fn();
const mockJsPDF = vi.fn().mockImplementation(() => ({
  addImage: mockAddImage,
  save: mockSave,
}));

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue(mockCanvas),
}));

vi.mock('jspdf', () => ({
  jsPDF: mockJsPDF,
}));

import { exportDashboardToPdf } from './exportPdf';

describe('exportDashboardToPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = `
      <section class="dashboard-page">
        <div class="dashboard-content">Test Content</div>
        <button class="export-pdf-btn">导出PDF</button>
      </section>
    `;
  });

  it('should generate PDF with A4 width and proportional height', async () => {
    await exportDashboardToPdf();

    // Verify jsPDF created with correct dimensions
    expect(mockJsPDF).toHaveBeenCalledWith({
      unit: 'mm',
      format: [210, 420], // 210 * (2400/1200) = 420
    });
    expect(mockAddImage).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
    const filename = mockSave.mock.calls[0][0];
    expect(filename).toMatch(/^项目仪表盘-CPID710R8-\d{8}\.pdf$/);
  });

  it('should hide export button during export', async () => {
    const btn = document.querySelector('.export-pdf-btn')!;
    const classListAddSpy = vi.spyOn(btn.classList, 'add');
    const classListRemoveSpy = vi.spyOn(btn.classList, 'remove');

    await exportDashboardToPdf();

    expect(classListAddSpy).toHaveBeenCalledWith('export-pdf-btn--hidden');
    expect(classListRemoveSpy).toHaveBeenCalledWith('export-pdf-btn--hidden');
  });

  it('should throw when .dashboard-page is missing', async () => {
    document.body.innerHTML = '';
    await expect(exportDashboardToPdf()).rejects.toThrow('Dashboard page element not found');
  });

  it('should restore button class even on error', async () => {
    const html2canvas = await import('html2canvas');
    (html2canvas.default as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Render failed'));

    await expect(exportDashboardToPdf()).rejects.toThrow('Render failed');
    const btn = document.querySelector('.export-pdf-btn')!;
    expect(btn.classList.contains('export-pdf-btn--hidden')).toBe(false);
  });
});
```

 - [x] **Step 2: 运行测试**

```bash
cd web && npx vitest run src/utils/exportPdf.test.ts
```
Expected: 所有测试通过

archived-with: 2026-06-22-timeline-pdf-export-v1-3
---

## Task 7: DashboardPage 按钮状态补充测试

**Files:**
- Modify: `web/src/features/project/DashboardPage.test.tsx`

 - [x] **Step 1: 补充按钮状态测试用例**

在 DashboardPage 测试文件中添加：

```typescript
it('should show export button when data loaded', async () => {
  render(<DashboardPage today="2026-06-22" />);
  await waitFor(() => {
    expect(screen.getByText('导出PDF')).toBeInTheDocument();
  });
});

it('should not show export button during loading', () => {
  render(<DashboardPage today="2026-06-22" />);
  // loading 状态下 .dashboard-page 不存在，按钮也不应存在
  expect(screen.queryByText('导出PDF')).not.toBeInTheDocument();
});
```

 - [x] **Step 2: 运行完整测试**

```bash
cd web && npx vitest run
```
Expected: 全部测试通过

archived-with: 2026-06-22-timeline-pdf-export-v1-3
---

## Task 8: 提交代码

**Files:** 所有变更

 - [x] **Step 1: 暂存并提交**

```bash
git add web/package.json web/package-lock.json \
  web/src/utils/exportPdf.ts web/src/utils/exportPdf.test.ts \
  web/src/features/project/DashboardPage.tsx web/src/features/project/DashboardPage.test.tsx \
  web/src/styles.css

git commit -m "feat: add dashboard PDF export button

- Add html2canvas + jsPDF dependencies
- Create utils/exportPdf.ts with exportDashboardToPdf()
- Add export button to DashboardPage at bottom-left of timeline
- A4 width, adaptive height, single continuous page
- Hide button in exported PDF via CSS class toggle
- Button disabled during loading and generation

Change: timeline-pdf-export-v1-3"
```

archived-with: 2026-06-22-timeline-pdf-export-v1-3
---

## Task 9: 验证构建

 - [x] **Step 1: 运行完整构建**

```bash
cd web && npm run build
```
Expected: Build succeeded, no TypeScript errors

 - [x] **Step 2: 运行完整测试套件**

```bash
cd web && npx vitest run
```
Expected: 全部测试通过
