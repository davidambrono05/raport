// Requires: npm install xlsx
import type { ReportData, ReportRow } from '../types';

export async function exportToExcel(report: ReportData): Promise<Blob> {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  if (report.kpis && report.kpis.length > 0) {
    const kpiRows = report.kpis.map((k) => [k.label, k.unit ? `${k.value} ${k.unit}` : k.value]);
    const ws = XLSX.utils.aoa_to_sheet([['Indicator', 'Valoare'], ...kpiRows]);
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Sumar');
  }

  for (const section of report.sections) {
    const headers = section.columns.map((c) => c.label);
    const rows = section.rows.map((row: ReportRow) =>
      section.columns.map((c) => {
        const val = row[c.key];
        if (val instanceof Date) return val.toLocaleDateString('ro-RO');
        return val ?? '';
      })
    );

    if (section.summary) {
      const summaryRow = section.columns.map((c) =>
        section.summary![c.key] !== undefined ? section.summary![c.key] : ''
      );
      rows.push(summaryRow);
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = section.columns.map((c) => ({ wch: c.width ?? 15 }));
    const sheetName = section.title.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadExcel(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
