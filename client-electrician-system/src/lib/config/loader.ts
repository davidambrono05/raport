import type { TenantConfig, ModulesConfig, WorkflowConfig, NotificationsConfig, ReportsConfig } from './types';
import type { BrandingConfig } from '../branding/types';
import type { PluginConfig } from '../plugins/types';
import { DEFAULT_BRANDING } from '../branding/types';

const cache = new Map<string, TenantConfig>();

const DEFAULT_MODULES: ModulesConfig = {
  dashboard: true,
  crm: true,
  workItems: true,
  teams: true,
  payments: true,
  reports: true,
  invoicing: false,
};

const DEFAULT_WORKFLOW: WorkflowConfig = {
  workItemLabel: 'Lucrare',
  workItemLabelPlural: 'Lucrări',
  statuses: [
    { id: 'new', label: 'Nou', color: '#64748b' },
    { id: 'in_progress', label: 'În curs', color: '#d97706' },
    { id: 'completed', label: 'Finalizat', color: '#16a34a', isFinal: true },
    { id: 'cancelled', label: 'Anulat', color: '#ef4444', isFinal: true },
  ],
  transitions: [
    { from: 'new', to: ['in_progress', 'cancelled'] },
    { from: 'in_progress', to: ['completed', 'cancelled'] },
  ],
  fields: [
    { id: 'title', label: 'Titlu', type: 'text', required: true },
    { id: 'description', label: 'Descriere', type: 'textarea' },
    { id: 'scheduled_date', label: 'Data programată', type: 'date' },
  ],
};

async function loadJson<T>(tenantId: string, filename: string, fallback: T): Promise<T> {
  try {
    const mod = await import(`../../../client-configs/${tenantId}/${filename}`);
    return mod.default as T;
  } catch {
    return fallback;
  }
}

export async function loadTenantConfig(tenantId: string): Promise<TenantConfig> {
  if (cache.has(tenantId)) return cache.get(tenantId)!;

  const [brandingRaw, modules, workflow, integrations, notifications, reports] = await Promise.all([
    loadJson<Partial<BrandingConfig>>(tenantId, 'branding.json', {}),
    loadJson<Partial<ModulesConfig>>(tenantId, 'modules.json', {}),
    loadJson<Partial<WorkflowConfig>>(tenantId, 'workflows.json', {}),
    loadJson<PluginConfig[]>(tenantId, 'integrations.json', []),
    loadJson<NotificationsConfig>(tenantId, 'notifications.json', { customTemplates: [], rules: [] }),
    loadJson<ReportsConfig>(tenantId, 'reports.json', { reports: [] }),
  ]);

  const config: TenantConfig = {
    branding: {
      ...DEFAULT_BRANDING,
      ...brandingRaw,
      tenantId,
      companyName: brandingRaw.companyName ?? tenantId,
      colors: { ...DEFAULT_BRANDING.colors, ...brandingRaw.colors },
      typography: { ...DEFAULT_BRANDING.typography, ...brandingRaw.typography },
    },
    modules: { ...DEFAULT_MODULES, ...modules },
    workflow: { ...DEFAULT_WORKFLOW, ...workflow },
    integrations,
    notifications,
    reports,
  };

  cache.set(tenantId, config);
  return config;
}

export function clearConfigCache(tenantId?: string) {
  if (tenantId) cache.delete(tenantId);
  else cache.clear();
}
