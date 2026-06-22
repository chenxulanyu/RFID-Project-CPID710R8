const A4_WIDTH_MM = 210;
const PRINT_MARGIN_MM = 10;
const DESKTOP_LAYOUT_WIDTH_PX = 1320;
const CSS_PX_PER_MM = 96 / 25.4;
const MIN_PAGE_HEIGHT_MM = 297;

export function getExportPdfTitle(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `项目仪表盘-CPID710R8-${y}${m}${d}`;
}

export function calculatePrintPageMetrics(contentHeightPx: number) {
  const printableWidthMm = A4_WIDTH_MM - PRINT_MARGIN_MM * 2;
  const printableWidthPx = printableWidthMm * CSS_PX_PER_MM;
  const scale = printableWidthPx / DESKTOP_LAYOUT_WIDTH_PX;
  const scaledContentHeightPx = Math.ceil(Math.max(contentHeightPx, 1) * scale);
  const contentHeightMm = scaledContentHeightPx / CSS_PX_PER_MM;
  const pageHeightMm = Math.max(MIN_PAGE_HEIGHT_MM, Math.ceil(contentHeightMm + PRINT_MARGIN_MM * 2));

  return {
    pageWidthMm: A4_WIDTH_MM,
    pageHeightMm,
    printableWidthPx,
    scale,
    scaledContentHeightPx,
  };
}

function collectDocumentStyleNodes(): string {
  return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');
}

function waitForPrintStyles(doc: Document): Promise<void> {
  const links = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  const waits = links.map((link) => {
    if (link.sheet) return Promise.resolve();

    return new Promise<void>((resolve) => {
      const done = () => resolve();
      link.addEventListener('load', done, { once: true });
      link.addEventListener('error', done, { once: true });
      window.setTimeout(done, 800);
    });
  });

  return Promise.all(waits).then(() => undefined);
}

async function waitForPrintableLayout(doc: Document): Promise<void> {
  await waitForPrintStyles(doc);
  if ('fonts' in doc) {
    await doc.fonts.ready;
  }
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

function getPrintWindowUrl(title: string): string {
  return `${window.location.origin}/pdf-export/${encodeURIComponent(title)}`;
}

function updatePrintWindowUrl(printWindow: Window, title: string): void {
  try {
    printWindow.history.replaceState(null, title, getPrintWindowUrl(title));
  } catch {
    // Some browser contexts keep about:blank immutable. Printing still works.
  }
}

function buildPrintDocument(dashboardHtml: string, stylesHtml: string, title: string): string {
  return `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <base href="${document.baseURI}">
      <meta name="viewport" content="width=${DESKTOP_LAYOUT_WIDTH_PX}">
      <title>${title}</title>
      ${stylesHtml}
      <style>
        html,
        body {
          background: #f6f8fb !important;
          margin: 0 !important;
          min-height: auto !important;
          overflow: visible !important;
          padding: 0 !important;
          width: ${DESKTOP_LAYOUT_WIDTH_PX}px !important;
        }

        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .top-nav,
        .export-pdf-btn {
          display: none !important;
        }

        .landscape-shell,
        .landscape-content {
          height: auto !important;
          left: auto !important;
          min-height: auto !important;
          overflow: visible !important;
          position: static !important;
          top: auto !important;
          transform: none !important;
          width: auto !important;
        }

        .app-shell {
          box-sizing: border-box !important;
          min-height: auto !important;
          padding: 0 !important;
          width: ${DESKTOP_LAYOUT_WIDTH_PX}px !important;
        }

        .dashboard-page {
          box-sizing: border-box !important;
          margin: 0 !important;
          max-width: none !important;
          width: ${DESKTOP_LAYOUT_WIDTH_PX}px !important;
        }

        .metric-grid,
        .timeline-scroll {
          overflow: visible !important;
        }

        .timeline-frame {
          min-width: 1040px !important;
        }

        .pdf-export-page,
        .pdf-export-scale {
          box-sizing: border-box;
          transform-origin: top left;
        }
      </style>
    </head>
    <body>
      <div class="pdf-export-page">
        <div class="pdf-export-scale">
          <main class="app-shell">
            ${dashboardHtml}
          </main>
        </div>
      </div>
    </body>
    </html>
  `;
}

function applyFinalPrintStyles(doc: Document, metrics: ReturnType<typeof calculatePrintPageMetrics>): void {
  const style = doc.createElement('style');
  style.textContent = `
    @page {
      size: ${metrics.pageWidthMm}mm ${metrics.pageHeightMm}mm;
      margin: ${PRINT_MARGIN_MM}mm;
    }

    html,
    body {
      height: ${metrics.scaledContentHeightPx}px !important;
      width: ${metrics.printableWidthPx}px !important;
    }

    .pdf-export-page {
      height: ${metrics.scaledContentHeightPx}px !important;
      overflow: hidden !important;
      width: ${metrics.printableWidthPx}px !important;
    }

    .pdf-export-scale {
      transform: scale(${metrics.scale});
      width: ${DESKTOP_LAYOUT_WIDTH_PX}px !important;
    }
  `;
  doc.head.appendChild(style);
}

async function printDashboardFromWindow(dashboardHtml: string): Promise<void> {
  const title = getExportPdfTitle();
  const printWindow = window.open('', '_blank', 'width=1320,height=900');
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.focus();

  const doc = printWindow.document;
  doc.open();
  doc.write(buildPrintDocument(dashboardHtml, collectDocumentStyleNodes(), title));
  doc.close();
  updatePrintWindowUrl(printWindow, title);

  await waitForPrintableLayout(doc);

  const scaleNode = doc.querySelector<HTMLElement>('.pdf-export-scale');
  const contentHeightPx = scaleNode
    ? Math.max(scaleNode.scrollHeight, scaleNode.getBoundingClientRect().height)
    : MIN_PAGE_HEIGHT_MM * CSS_PX_PER_MM;
  const metrics = calculatePrintPageMetrics(contentHeightPx);
  applyFinalPrintStyles(doc, metrics);

  printWindow.addEventListener(
    'afterprint',
    () => {
      window.setTimeout(() => printWindow.close(), 500);
    },
    { once: true },
  );

  printWindow.focus();
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 350);
}

/**
 * Export the dashboard page as a searchable, browser-native PDF.
 * The print document keeps the desktop dashboard width, scales it to
 * A4 printable width, and computes a single long page height.
 */
export function exportDashboardToPdf(): void {
  const dashboardEl = document.querySelector('.dashboard-page');
  if (!dashboardEl) {
    window.print();
    return;
  }

  void printDashboardFromWindow(dashboardEl.outerHTML).catch(() => window.print());
}
