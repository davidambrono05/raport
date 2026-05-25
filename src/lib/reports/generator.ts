import type { ReportData, ReportSection } from './types';

export interface WorkItemStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  totalRevenue: number;
}

export interface ClientStats {
  clientId: string;
  clientName: string;
  workItems: number;
  totalInvoiced: number;
  totalPaid: number;
}

export interface TeamStats {
  memberId: string;
  memberName: string;
  workItemsAssigned: number;
  workItemsCompleted: number;
}

export function generateSummaryReport(params: {
  title: string;
  period: { from: Date; to: Date };
  workItemStats: WorkItemStats;
  clientStats: ClientStats[];
  teamStats: TeamStats[];
}): ReportData {
  const { title, period, workItemStats, clientStats, teamStats } = params;

  const clientSection: ReportSection = {
    title: 'Statistici per client',
    columns: [
      { key: 'clientName', label: 'Client', type: 'string', width: 30 },
      { key: 'workItems', label: 'Lucrări', type: 'number', width: 10 },
      { key: 'totalInvoiced', label: 'Facturat (RON)', type: 'currency', width: 15 },
      { key: 'totalPaid', label: 'Încasat (RON)', type: 'currency', width: 15 },
    ],
    rows: clientStats,
    summary: {
      totalInvoiced: clientStats.reduce((s, c) => s + c.totalInvoiced, 0),
      totalPaid: clientStats.reduce((s, c) => s + c.totalPaid, 0),
    },
  };

  const teamSection: ReportSection = {
    title: 'Statistici per echipă',
    columns: [
      { key: 'memberName', label: 'Angajat', type: 'string', width: 30 },
      { key: 'workItemsAssigned', label: 'Atribuite', type: 'number', width: 12 },
      { key: 'workItemsCompleted', label: 'Finalizate', type: 'number', width: 12 },
    ],
    rows: teamStats,
  };

  return {
    title,
    generatedAt: new Date(),
    period,
    kpis: [
      { label: 'Total lucrări', value: workItemStats.total },
      { label: 'Finalizate', value: workItemStats.completed },
      { label: 'În curs', value: workItemStats.inProgress },
      { label: 'Venit total', value: workItemStats.totalRevenue, unit: 'RON' },
    ],
    sections: [clientSection, teamSection],
  };
}
