import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    width: 1200,
    height: 2400,
    toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,xxx'),
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
import { jsPDF } from 'jspdf';
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

  it('should use scale=1 and correct viewport', async () => {
    await exportDashboardToPdf();

    expect(mockedHtml2canvas).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        scale: 1,
        useCORS: true,
        backgroundColor: '#f6f8fb',
        windowWidth: 1320,
      }),
    );
  });

  it('should create PDF with 10mm margins and JPEG', async () => {
    await exportDashboardToPdf();

    // A4 width 210mm, 10mm margins, canvas 1200x2400
    // contentW = 190, contentH = 190 * (2400/1200) = 380, pageH = 400
    expect(vi.mocked(jsPDF).mock.calls[0][0]).toEqual({
      unit: 'mm',
      format: [210, 400],
    });

    const instance = vi.mocked(jsPDF).mock.results[0].value as any;
    expect(instance.addImage).toHaveBeenCalledWith(
      'data:image/jpeg;base64,xxx',
      'JPEG',
      10,
      10,
      190,
      380,
    );
    expect(instance.save).toHaveBeenCalled();
    const filename = instance.save.mock.calls[0][0];
    expect(filename).toMatch(/^项目仪表盘-CPID710R8-\d{8}\.pdf$/);
  });

  it('should hide and restore export button', async () => {
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

  it('should restore button class even on html2canvas error', async () => {
    mockedHtml2canvas.mockRejectedValueOnce(new Error('Render failed'));

    await expect(exportDashboardToPdf()).rejects.toThrow('Render failed');
    const btn = document.querySelector('.export-pdf-btn')!;
    expect(btn.classList.contains('export-pdf-btn--hidden')).toBe(false);
  });
});
