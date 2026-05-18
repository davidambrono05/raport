export interface KPI {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
}

export interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  createdAt: Date;
}

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  status?: string;
}

export interface DashboardData {
  kpis: KPI[];
  alerts: AlertItem[];
  recentActivity: ActivityItem[];
}
