/**
 * Export the dashboard page as PDF via browser native print.
 * Opens a new window containing only the dashboard content with
 * all original stylesheets, then triggers print. This isolates
 * the print output from the main page's responsive CSS and avoids
 * @media print cross-interaction.
 */
export function exportDashboardToPdf(): void {
  const dashboardEl = document.querySelector('.dashboard-page');
  if (!dashboardEl) {
    window.print();
    return;
  }

  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');

  const printWindow = window.open('', '_blank', 'width=1320');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>项目仪表盘 - CPID710R8</title>
      <style>
        @page {
          size: 210mm auto;
          margin: 10mm;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          background: #f6f8fb;
        }
        .top-nav,
        .export-pdf-btn {
          display: none !important;
        }
        .app-shell {
          padding: 0 !important;
          min-height: auto !important;
        }
        .dashboard-page,
        .dashboard-panel,
        .kpi-card,
        .risk-pill,
        .timeline-row,
        .task-detail-row {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        ${styles}
      </style>
    </head>
    <body>
      <main class="app-shell">
        ${dashboardEl.outerHTML}
      </main>
    </body>
    </html>
  `);

  printWindow.document.close();

  // Slight delay to let styles settle, then print
  setTimeout(() => {
    printWindow.print();
  }, 400);
}
