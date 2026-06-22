/**
 * Trigger browser native print dialog.
 * User selects "Save as PDF" in the dialog to export the dashboard.
 * CSS @media print rules in styles.css handle layout, margins, and hiding UI.
 */
export function exportDashboardToPdf(): void {
  window.print();
}
