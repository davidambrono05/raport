export type NotificationChannel = 'whatsapp' | 'email' | 'both';

export type NotificationFrequency =
  | { type: 'immediate' }
  | { type: 'daily'; hour: number }
  | { type: 'weekly'; dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; hour: number }
  | { type: 'monthly'; dayOfMonth: number; hour: number };

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
}

export interface NotificationRule {
  id: string;
  templateId: string;
  trigger: 'work_item_created' | 'work_item_completed' | 'invoice_sent' | 'payment_overdue' | 'manual';
  channel: NotificationChannel;
  frequency: NotificationFrequency;
  enabled: boolean;
}

export interface NotificationPayload {
  templateId: string;
  channel: NotificationChannel;
  recipient: {
    phone?: string;
    email?: string;
    name?: string;
  };
  variables: Record<string, string>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
