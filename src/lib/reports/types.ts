export interface ReportColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'currency' | 'date' | 'badge';
  width?: number;
}

export interface ReportRow {
  [key: string]: string | number | Date | null;
}

export interface ReportSection {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  summary?: Record<string, number>;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  generatedAt: Date;
  period?: { from: Date; to: Date };
  sections: ReportSection[];
  kpis?: Array<{ label: string; value: string | number; unit?: string }>;
}

export type ExportFormat = 'excel' | 'pdf';

export interface ReportConfig {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: ExportFormat;
  recipientEmails: string[];
  enabled: boolean;
}
