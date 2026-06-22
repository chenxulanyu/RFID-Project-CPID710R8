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
      scale: 2,
      useCORS: true,
      backgroundColor: '#f6f8fb',
      windowWidth: 1320,
    });
    const pdfW = 210;
    const pdfH = pdfW * (canvas.height / canvas.width);
    const pdf = new jsPDF({ unit: 'mm', format: [pdfW, pdfH] });
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`项目仪表盘-CPID710R8-${getDateString()}.pdf`);
  } finally {
    btn?.classList.remove(HIDDEN_CLASS);
  }
}
