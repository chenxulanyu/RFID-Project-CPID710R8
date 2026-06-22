import { describe, it, expect, vi, afterEach } from 'vitest';
import { exportDashboardToPdf } from './exportPdf';

describe('exportDashboardToPdf', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call window.print()', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    exportDashboardToPdf();
    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
