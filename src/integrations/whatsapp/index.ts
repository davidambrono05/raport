import type { Plugin, PluginFactory } from '../../lib/plugins/types';

export interface WhatsAppMessage {
  to: string;
  body: string;
}

export interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  variables: string[];
}

export interface WhatsAppPlugin extends Plugin {
  sendMessage(msg: WhatsAppMessage): Promise<{ messageId: string }>;
  sendTemplate(msg: WhatsAppTemplateMessage): Promise<{ messageId: string }>;
}

type Provider = 'twilio' | 'wati';

class WhatsAppPluginImpl implements WhatsAppPlugin {
  readonly id = 'whatsapp';
  readonly name = 'WhatsApp';
  readonly version = '1.0.0';
  readonly description = 'Mesaje WhatsApp via Twilio sau WATI';

  private provider: Provider = 'twilio';
  private config: Record<string, string> = {};

  async initialize(cfg: Record<string, string>): Promise<void> {
    if (!cfg.provider) throw new Error('WhatsApp: provider (twilio|wati) este obligatoriu');
    this.provider = cfg.provider as Provider;
    this.config = cfg;

    if (this.provider === 'twilio' && (!cfg.accountSid || !cfg.authToken || !cfg.fromNumber)) {
      throw new Error('WhatsApp/Twilio: accountSid, authToken, fromNumber sunt obligatorii');
    }
    if (this.provider === 'wati' && (!cfg.apiEndpoint || !cfg.apiToken)) {
      throw new Error('WhatsApp/WATI: apiEndpoint, apiToken sunt obligatorii');
    }
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async sendMessage(msg: WhatsAppMessage): Promise<{ messageId: string }> {
    if (this.provider === 'twilio') return this.sendTwilio(msg);
    return this.sendWati(msg);
  }

  async sendTemplate(msg: WhatsAppTemplateMessage): Promise<{ messageId: string }> {
    if (this.provider === 'wati') return this.sendWatiTemplate(msg);
    throw new Error('sendTemplate este suportat doar de WATI');
  }

  private async sendTwilio(msg: WhatsAppMessage): Promise<{ messageId: string }> {
    const { accountSid, authToken, fromNumber } = this.config;
    const body = new URLSearchParams({
      From: `whatsapp:${fromNumber}`,
      To: `whatsapp:${msg.to}`,
      Body: msg.body,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );
    if (!res.ok) throw new Error(`Twilio sendMessage: ${res.status}`);
    const data = await res.json() as { sid: string };
    return { messageId: data.sid };
  }

  private async sendWati(msg: WhatsAppMessage): Promise<{ messageId: string }> {
    const { apiEndpoint, apiToken } = this.config;
    const res = await fetch(`${apiEndpoint}/api/v1/sendSessionMessage/${msg.to}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageText: msg.body }),
    });
    if (!res.ok) throw new Error(`WATI sendMessage: ${res.status}`);
    const data = await res.json() as { id: string };
    return { messageId: data.id };
  }

  private async sendWatiTemplate(msg: WhatsAppTemplateMessage): Promise<{ messageId: string }> {
    const { apiEndpoint, apiToken } = this.config;
    const res = await fetch(`${apiEndpoint}/api/v1/sendTemplateMessage`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        whatsappNumber: msg.to,
        template_name: msg.templateName,
        broadcast_name: msg.templateName,
        parameters: msg.variables.map((v) => ({ name: 'v', value: v })),
      }),
    });
    if (!res.ok) throw new Error(`WATI sendTemplate: ${res.status}`);
    const data = await res.json() as { id: string };
    return { messageId: data.id };
  }
}

export const whatsappFactory: PluginFactory<WhatsAppPlugin> = {
  meta: {
    id: 'whatsapp',
    name: 'WhatsApp',
    version: '1.0.0',
    description: 'Mesaje WhatsApp via Twilio sau WATI',
  },
  create: () => new WhatsAppPluginImpl(),
};
