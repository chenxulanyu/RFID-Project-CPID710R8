import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { calculatePrintPageMetrics, exportDashboardToPdf } from './exportPdf';

describe('exportDashboardToPdf', () => {
  let printSpy: ReturnType<typeof vi.spyOn>;
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fall back to window.print() when .dashboard-page is missing', () => {
    document.body.innerHTML = '';
    exportDashboardToPdf();
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('should fall back to window.print() when the print window is blocked', async () => {
    document.body.innerHTML = `<section class="dashboard-page"><div>ok</div></section>`;
    exportDashboardToPdf();

    await vi.waitFor(() => {
      expect(printSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('should create an isolated top-level print document when .dashboard-page exists', async () => {
    const printDocument = document.implementation.createHTMLDocument('');
    const printWindowSpy = vi.fn();
    openSpy.mockReturnValue({
      document: printDocument,
      addEventListener: vi.fn(),
      close: vi.fn(),
      focus: vi.fn(),
      print: printWindowSpy,
    } as unknown as Window);

    document.body.innerHTML = `<style>.dashboard-page { color: rgb(23, 32, 42); }</style><section class="dashboard-page"><div>ok</div><button class="export-pdf-btn">导出PDF</button></section>`;
    exportDashboardToPdf();

    await vi.waitFor(() => {
      expect(printWindowSpy).toHaveBeenCalledTimes(1);
    });

    expect(openSpy).toHaveBeenCalledWith('', '_blank', 'width=1320,height=900');
    expect(printDocument.documentElement.innerHTML).toContain('width: 1320px');
    expect(printDocument.documentElement.innerHTML).toContain('@page');
    expect(printDocument.documentElement.innerHTML).toContain('size: 210mm 297mm');
    expect(printDocument.documentElement.innerHTML).toContain('.export-pdf-btn');
    expect(printDocument.querySelector('title')?.textContent).toContain('项目仪表盘-CPID710R8-');
  });

  it('should calculate a single long page when content is taller than A4', () => {
    const metrics = calculatePrintPageMetrics(3000);
    expect(metrics.pageWidthMm).toBe(210);
    expect(metrics.pageHeightMm).toBeGreaterThan(297);
    expect(metrics.scale).toBeLessThan(1);
  });
});
