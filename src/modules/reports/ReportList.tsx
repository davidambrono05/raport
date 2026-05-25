import type { ReportEntry, ReportStatus } from './types';

interface ReportListProps {
  reports: ReportEntry[];
  onGenerate?: (report: ReportEntry) => void;
  onDownload?: (report: ReportEntry) => void;
}

const FREQUENCY_LABELS = {
  weekly: 'Săptămânal',
  monthly: 'Lunar',
  manual: 'Manual',
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  idle: 'Negenerat',
  generating: 'Se generează...',
  ready: 'Gata',
  error: 'Eroare',
};

export function ReportList({ reports, onGenerate, onDownload }: ReportListProps) {
  return (
    <div className="p-6 space-y-4">
      <h2 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>
        Rapoarte ({reports.length})
      </h2>

      <div className="space-y-2">
        {reports.map((report) => (
          <div
            key={report.id}
            className="rounded-lg border p-4 flex items-center justify-between gap-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
          >
            <div className="min-w-0">
              <p className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                {report.name}
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                {FREQUENCY_LABELS[report.frequency]} · {report.format.toUpperCase()}
                {report.lastGeneratedAt &&
                  ` · Ultima generare: ${report.lastGeneratedAt.toLocaleDateString('ro-RO')}`}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span
                className="text-xs"
                style={{
                  color:
                    report.status === 'ready'
                      ? '#16a34a'
                      : report.status === 'error'
                      ? 'var(--color-destructive)'
                      : 'var(--color-muted-foreground)',
                }}
              >
                {STATUS_LABELS[report.status]}
              </span>

              {report.status === 'ready' && onDownload && (
                <button
                  onClick={() => onDownload(report)}
                  className="text-sm px-3 py-1.5 rounded border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                >
                  Descarcă
                </button>
              )}

              {onGenerate && report.status !== 'generating' && (
                <button
                  onClick={() => onGenerate(report)}
                  className="text-sm px-3 py-1.5 rounded"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-primary-foreground)',
                  }}
                >
                  Generează
                </button>
              )}
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--color-muted-foreground)' }}>
            Niciun raport configurat.
          </p>
        )}
      </div>
    </div>
  );
}
