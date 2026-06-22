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

  it('should create an isolated iframe print document when .dashboard-page exists', async () => {
    const iframePrintSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const element = Document.prototype.createElement.call(document, tagName, options);
      if (tagName === 'iframe') {
        Object.defineProperty(element, 'contentWindow', {
          configurable: true,
          value: {
            addEventListener: vi.fn(),
            focus: vi.fn(),
            print: iframePrintSpy,
          },
        });
      }
      return element;
    });

    document.body.innerHTML = `<style>.dashboard-page { color: rgb(23, 32, 42); }</style><section class="dashboard-page"><div>ok</div><button class="export-pdf-btn">导出PDF</button></section>`;
    exportDashboardToPdf();

    await vi.waitFor(() => {
      expect(iframePrintSpy).toHaveBeenCalledTimes(1);
    });

    expect(openSpy).not.toHaveBeenCalled();
    const iframe = document.querySelector('iframe');
    expect(iframe?.contentDocument?.documentElement.innerHTML).toContain('width: 1320px');
    expect(iframe?.contentDocument?.documentElement.innerHTML).toContain('@page');
    expect(iframe?.contentDocument?.documentElement.innerHTML).toContain('size: 210mm 297mm');
    expect(iframe?.contentDocument?.documentElement.innerHTML).toContain('.export-pdf-btn');
  });

  it('should calculate a single long page when content is taller than A4', () => {
    const metrics = calculatePrintPageMetrics(3000);
    expect(metrics.pageWidthMm).toBe(210);
    expect(metrics.pageHeightMm).toBeGreaterThan(297);
    expect(metrics.scale).toBeLessThan(1);
  });
});
