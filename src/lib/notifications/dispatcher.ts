import type { NotificationPayload, NotificationResult } from './types';
import { getTemplate, renderTemplate } from './templates';
import { pluginRegistry } from '../plugins/registry';
import type { WhatsAppPlugin } from '../../integrations/whatsapp';
import type { EmailPlugin } from '../../integrations/email';

export async function dispatch(payload: NotificationPayload): Promise<NotificationResult[]> {
  const template = getTemplate(payload.templateId);
  const rendered = renderTemplate(template, payload.variables);
  const results: NotificationResult[] = [];

  const sendWhatsApp = payload.channel === 'whatsapp' || payload.channel === 'both';
  const sendEmail = payload.channel === 'email' || payload.channel === 'both';

  if (sendWhatsApp && payload.recipient.phone) {
    if (!pluginRegistry.has('whatsapp')) {
      results.push({ success: false, error: 'WhatsApp plugin not initialized' });
    } else {
      try {
        const wp = pluginRegistry.get<WhatsAppPlugin>('whatsapp');
        const { messageId } = await wp.sendMessage({
          to: payload.recipient.phone,
          body: rendered.body,
        });
        results.push({ success: true, messageId });
      } catch (err) {
        results.push({ success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  if (sendEmail && payload.recipient.email) {
    if (!pluginRegistry.has('email')) {
      results.push({ success: false, error: 'Email plugin not initialized' });
    } else {
      try {
        const ep = pluginRegistry.get<EmailPlugin>('email');
        const { messageId } = await ep.send({
          to: payload.recipient.email,
          subject: rendered.subject ?? template.name,
          html: rendered.body,
          text: rendered.body.replace(/<[^>]+>/g, ''),
        });
        results.push({ success: true, messageId });
      } catch (err) {
        results.push({ success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  return results;
}
