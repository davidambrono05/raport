import type { Plugin, PluginFactory } from '../../lib/plugins/types';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailPlugin extends Plugin {
  send(msg: EmailMessage): Promise<{ messageId: string }>;
}

class EmailPluginImpl implements EmailPlugin {
  readonly id = 'email';
  readonly name = 'Email (Resend)';
  readonly version = '1.0.0';
  readonly description = 'Trimitere emailuri via Resend';

  private apiKey = '';
  private defaultFrom = '';

  async initialize(config: Record<string, string>): Promise<void> {
    if (!config.apiKey || !config.defaultFrom) {
      throw new Error('Email: apiKey și defaultFrom sunt obligatorii');
    }
    this.apiKey = config.apiKey;
    this.defaultFrom = config.defaultFrom;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async send(msg: EmailMessage): Promise<{ messageId: string }> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: msg.from ?? this.defaultFrom,
        to: Array.isArray(msg.to) ? msg.to : [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    });
    if (!res.ok) throw new Error(`Email send: ${res.status}`);
    const data = await res.json() as { id: string };
    return { messageId: data.id };
  }
}

export const emailFactory: PluginFactory<EmailPlugin> = {
  meta: {
    id: 'email',
    name: 'Email (Resend)',
    version: '1.0.0',
    description: 'Trimitere emailuri via Resend',
  },
  create: () => new EmailPluginImpl(),
};
