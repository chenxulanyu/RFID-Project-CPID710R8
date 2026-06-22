import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    width: 1200,
    height: 2400,
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,xxx'),
  }),
}));

vi.mock('jspdf', () => {
  function MockJsPDF(this: any) {
    this.addImage = vi.fn();
    this.save = vi.fn();
  }
  return { jsPDF: vi.fn(MockJsPDF) };
});

import html2canvas from 'html2canvas';
import { exportDashboardToPdf } from './exportPdf';

const mockedHtml2canvas = html2canvas as unknown as ReturnType<typeof vi.fn>;

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

  it('should pass correct options to html2canvas', async () => {
    await exportDashboardToPdf();

    expect(mockedHtml2canvas).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        scale: 2,
        useCORS: true,
        backgroundColor: '#f6f8fb',
        windowWidth: 1320,
      }),
    );
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
    mockedHtml2canvas.mockRejectedValueOnce(new Error('Render failed'));

    await expect(exportDashboardToPdf()).rejects.toThrow('Render failed');
    const btn = document.querySelector('.export-pdf-btn')!;
    expect(btn.classList.contains('export-pdf-btn--hidden')).toBe(false);
  });
});
