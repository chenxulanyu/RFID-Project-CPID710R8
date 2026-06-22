import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { exportDashboardToPdf } from './exportPdf';

describe('exportDashboardToPdf', () => {
  let printSpy: ReturnType<typeof vi.spyOn>;
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
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

  it('should fall back to window.print() when popup is blocked', () => {
    document.body.innerHTML = `<section class="dashboard-page"><div>ok</div></section>`;
    openSpy.mockReturnValue(null);
    exportDashboardToPdf();
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('should open a new window and print when .dashboard-page exists', () => {
    const mockPrint = vi.fn();
    const mockWrite = vi.fn();
    const mockClose = vi.fn();

    openSpy.mockReturnValue({
      document: { write: mockWrite, close: mockClose },
      print: mockPrint,
      closed: false,
    } as unknown as Window);

    document.body.innerHTML = `<section class="dashboard-page"><div>ok</div></section>`;
    exportDashboardToPdf();

    expect(openSpy).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('dashboard-page'));
    expect(mockClose).toHaveBeenCalled();
  });
});
