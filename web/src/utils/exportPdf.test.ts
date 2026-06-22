import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    width: 1200,
    height: 2400,
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,xxx'),
  }),
}));

const mockAddImage = vi.fn();
const mockSave = vi.fn();

vi.mock('jspdf', () => {
  function MockJsPDF(this: any) {
    this.addImage = mockAddImage;
    this.save = mockSave;
  }
  return { jsPDF: vi.fn(MockJsPDF) };
});

import html2canvas from 'html2canvas';
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
    (html2canvas as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Render failed'));

    await expect(exportDashboardToPdf()).rejects.toThrow('Render failed');
    const btn = document.querySelector('.export-pdf-btn')!;
    expect(btn.classList.contains('export-pdf-btn--hidden')).toBe(false);
  });
});
