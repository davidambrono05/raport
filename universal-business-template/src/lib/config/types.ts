import type { BrandingConfig } from '../branding/types';
import type { PluginConfig } from '../plugins/types';
import type { NotificationRule, NotificationTemplate } from '../notifications/types';
import type { ReportConfig } from '../reports/types';

export interface WorkflowStatus {
  id: string;
  label: string;
  color: string;
  isFinal?: boolean;
}

export interface WorkflowTransition {
  from: string;
  to: string[];
}

export interface WorkflowField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: string[];
}

export interface WorkflowConfig {
  workItemLabel: string;
  workItemLabelPlural: string;
  statuses: WorkflowStatus[];
  transitions: WorkflowTransition[];
  fields: WorkflowField[];
}

export interface ModulesConfig {
  dashboard: boolean;
  crm: boolean;
  workItems: boolean;
  teams: boolean;
  payments: boolean;
  reports: boolean;
  invoicing: boolean;
}

export interface NotificationsConfig {
  customTemplates: NotificationTemplate[];
  rules: NotificationRule[];
}

export interface ReportsConfig {
  reports: ReportConfig[];
}

export interface TenantConfig {
  branding: BrandingConfig;
  modules: ModulesConfig;
  workflow: WorkflowConfig;
  integrations: PluginConfig[];
  notifications: NotificationsConfig;
  reports: ReportsConfig;
}
