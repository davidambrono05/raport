import type { DashboardData, KPI, AlertItem, ActivityItem } from './types';

interface DashboardProps {
  data: DashboardData;
}

export function Dashboard({ data }: DashboardProps) {
  return (
    <div className="p-6 space-y-6">
      <KPIGrid kpis={data.kpis} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsPanel alerts={data.alerts} />
        <ActivityPanel items={data.recentActivity} />
      </div>
    </div>
  );
}

function KPIGrid({ kpis }: { kpis: KPI[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <div
          key={i}
          className="rounded-lg border p-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {kpi.label}
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-foreground)' }}>
            {kpi.value}
            {kpi.unit && (
              <span className="text-sm font-normal ml-1" style={{ color: 'var(--color-muted-foreground)' }}>
                {kpi.unit}
              </span>
            )}
          </p>
          {kpi.trend && (
            <p
              className="text-xs mt-1"
              style={{
                color:
                  kpi.trend.direction === 'up'
                    ? '#16a34a'
                    : kpi.trend.direction === 'down'
                    ? 'var(--color-destructive)'
                    : 'var(--color-muted-foreground)',
              }}
            >
              {kpi.trend.direction === 'up' ? '↑' : kpi.trend.direction === 'down' ? '↓' : '→'}{' '}
              {kpi.trend.value}%
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function AlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  const COLORS: Record<AlertItem['type'], string> = {
    error: 'var(--color-destructive)',
    warning: '#d97706',
    info: 'var(--color-primary)',
  };

  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
    >
      <h3 className="font-semibold mb-3" style={{ color: 'var(--color-foreground)' }}>
        Alerte ({alerts.length})
      </h3>
      {alerts.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Nicio alertă activă.
        </p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-start gap-2 text-sm">
              <span style={{ color: COLORS[a.type] }}>●</span>
              <span style={{ color: 'var(--color-foreground)' }}>{a.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityPanel({ items }: { items: ActivityItem[] }) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
    >
      <h3 className="font-semibold mb-3" style={{ color: 'var(--color-foreground)' }}>
        Activitate recentă
      </h3>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Nicio activitate recentă.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <div
                className="mt-1 h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)' }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                    {item.description}
                  </p>
                )}
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                  {item.timestamp.toLocaleDateString('ro-RO')}
                  {item.status && ` · ${item.status}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
