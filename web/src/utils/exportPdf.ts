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
const A4_WIDTH_MM = 210;
const MARGIN_MM = 10;
const JPEG_QUALITY = 0.85;

export async function exportDashboardToPdf(): Promise<void> {
  const dashboardEl = document.querySelector('.dashboard-page');
  if (!dashboardEl) {
    throw new Error('Dashboard page element not found');
  }

  const container = dashboardEl as HTMLElement;
  const btn = container.querySelector('.export-pdf-btn');
  btn?.classList.add(HIDDEN_CLASS);

  try {
    const canvas = await html2canvas(container, {
      scale: 1,
      useCORS: true,
      backgroundColor: '#f6f8fb',
      windowWidth: 1320,
    });

    const contentW = A4_WIDTH_MM - 2 * MARGIN_MM;
    const contentH = contentW * (canvas.height / canvas.width);
    const pageH = contentH + 2 * MARGIN_MM;

    const pdf = new jsPDF({ unit: 'mm', format: [A4_WIDTH_MM, pageH] });
    const imgData = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    pdf.addImage(imgData, 'JPEG', MARGIN_MM, MARGIN_MM, contentW, contentH);
    pdf.save(`项目仪表盘-CPID710R8-${getDateString()}.pdf`);
  } finally {
    btn?.classList.remove(HIDDEN_CLASS);
  }
}
