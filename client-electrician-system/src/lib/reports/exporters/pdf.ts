// Requires: npm install jspdf jspdf-autotable
import type { ReportData, ReportRow } from '../types';

export async function exportToPdf(
  report: ReportData,
  branding?: { companyName: string; primaryColor: string }
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const primaryColor = branding?.primaryColor ?? '#2563eb';
  const [r, g, b] = hexToRgb(primaryColor);

  // Header
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, 297, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(report.title, 14, 13);

  if (branding?.companyName) {
    doc.setFontSize(10);
    doc.text(branding.companyName, 283, 13, { align: 'right' });
  }

  doc.setTextColor(0, 0, 0);
  let y = 28;

  // Metadata
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generat: ${report.generatedAt.toLocaleDateString('ro-RO')}`, 14, y);
  if (report.period) {
    doc.text(
      `Perioadă: ${report.period.from.toLocaleDateString('ro-RO')} – ${report.period.to.toLocaleDateString('ro-RO')}`,
      14, y + 5
    );
    y += 5;
  }
  y += 8;

  // KPIs
  if (report.kpis && report.kpis.length > 0) {
    const colWidth = (297 - 28) / report.kpis.length;
    report.kpis.forEach((kpi, i) => {
      const x = 14 + i * colWidth;
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(x, y, colWidth - 4, 14, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(kpi.label, x + 3, y + 5);
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const val = kpi.unit ? `${kpi.value} ${kpi.unit}` : String(kpi.value);
      doc.text(val, x + 3, y + 11);
    });
    y += 22;
  }

  // Sections
  for (const section of report.sections) {
    doc.setFontSize(10);
    doc.setTextColor(r, g, b);
    doc.text(section.title, 14, y);
    y += 4;

    const head = [section.columns.map((c) => c.label)];
    const body = section.rows.map((row: ReportRow) =>
      section.columns.map((c) => {
        const val = row[c.key];
        if (val instanceof Date) return val.toLocaleDateString('ro-RO');
        if (c.type === 'currency' && typeof val === 'number') return `${val.toFixed(2)} RON`;
        return val ?? '';
      })
    );

    autoTable(doc, {
      startY: y,
      head,
      body,
      headStyles: { fillColor: [r, g, b], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  return doc.output('blob');
}

export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [37, 99, 235];
}
