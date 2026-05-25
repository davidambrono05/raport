export type ReportStatus = 'idle' | 'generating' | 'ready' | 'error';

export interface ReportEntry {
  id: string;
  name: string;
  frequency: 'weekly' | 'monthly' | 'manual';
  format: 'excel' | 'pdf';
  lastGeneratedAt?: Date;
  status: ReportStatus;
}
