import type { NotificationTemplate } from './types';

const templateStore = new Map<string, NotificationTemplate>();

export function registerTemplate(template: NotificationTemplate): void {
  templateStore.set(template.id, template);
}

export function getTemplate(id: string): NotificationTemplate {
  const tpl = templateStore.get(id);
  if (!tpl) throw new Error(`Template "${id}" not found`);
  return tpl;
}

export function renderTemplate(template: NotificationTemplate, variables: Record<string, string>): {
  subject?: string;
  body: string;
} {
  const replace = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);

  return {
    subject: template.subject ? replace(template.subject) : undefined,
    body: replace(template.body),
  };
}

export function loadTemplates(templates: NotificationTemplate[]): void {
  for (const tpl of templates) registerTemplate(tpl);
}

// ── Template-uri built-in ─────────────────────────────────

export const BUILT_IN_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'work_item_created',
    name: 'Lucrare nouă creată',
    channel: 'whatsapp',
    body: 'Bună ziua {{client_name}}, lucrarea "{{work_item_title}}" a fost înregistrată. Număr referință: {{work_item_id}}.',
  },
  {
    id: 'work_item_completed',
    name: 'Lucrare finalizată',
    channel: 'whatsapp',
    body: 'Bună ziua {{client_name}}, lucrarea "{{work_item_title}}" a fost finalizată. Vă mulțumim!',
  },
  {
    id: 'invoice_sent',
    name: 'Factură trimisă',
    channel: 'email',
    subject: 'Factură {{invoice_number}} — {{company_name}}',
    body: '<p>Bună ziua {{client_name}},</p><p>Vă transmitem factura <strong>{{invoice_number}}</strong> în valoare de <strong>{{amount}} RON</strong>.</p><p>Scadență: {{due_date}}</p>',
  },
  {
    id: 'payment_overdue',
    name: 'Plată restantă',
    channel: 'both',
    subject: 'Reminder plată — {{invoice_number}}',
    body: 'Bună ziua {{client_name}}, factura {{invoice_number}} de {{amount}} RON este restantă din {{due_date}}. Vă rugăm să efectuați plata. Mulțumim!',
  },
];

loadTemplates(BUILT_IN_TEMPLATES);
