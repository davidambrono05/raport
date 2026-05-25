import type { Plugin, PluginFactory } from '../../lib/plugins/types';

export interface SmartBillInvoice {
  seriesName: string;
  client: {
    name: string;
    vatCode?: string;
    address?: string;
    email?: string;
  };
  products: Array<{
    name: string;
    quantity: number;
    price: number;
    vatName: string;
  }>;
  issueDate: string;
  isDraft?: boolean;
}

export interface SmartBillPlugin extends Plugin {
  createInvoice(invoice: SmartBillInvoice): Promise<{ number: string; series: string; url?: string }>;
  getInvoice(series: string, number: string): Promise<Record<string, unknown>>;
  sendInvoiceByEmail(series: string, number: string, email: string): Promise<void>;
}

class SmartBillPluginImpl implements SmartBillPlugin {
  readonly id = 'smartbill';
  readonly name = 'SmartBill';
  readonly version = '1.0.0';
  readonly description = 'Facturare SmartBill pentru România';

  private apiKey = '';
  private email = '';
  private companyVatCode = '';
  private baseUrl = 'https://ws.smartbill.ro/SBORO/api';

  async initialize(config: Record<string, string>): Promise<void> {
    if (!config.apiKey || !config.email || !config.companyVatCode) {
      throw new Error('SmartBill: apiKey, email și companyVatCode sunt obligatorii');
    }
    this.apiKey = config.apiKey;
    this.email = config.email;
    this.companyVatCode = config.companyVatCode;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.request('GET', '/invoice/series');
      return res.ok;
    } catch {
      return false;
    }
  }

  async createInvoice(invoice: SmartBillInvoice) {
    const res = await this.request('POST', '/invoice', {
      companyVatCode: this.companyVatCode,
      ...invoice,
    });
    if (!res.ok) throw new Error(`SmartBill createInvoice: ${res.status}`);
    const data = await res.json() as { number: string; series: string; url?: string };
    return data;
  }

  async getInvoice(series: string, number: string) {
    const params = new URLSearchParams({ cif: this.companyVatCode, seriesname: series, number });
    const res = await this.request('GET', `/invoice?${params}`);
    if (!res.ok) throw new Error(`SmartBill getInvoice: ${res.status}`);
    return res.json() as Promise<Record<string, unknown>>;
  }

  async sendInvoiceByEmail(series: string, number: string, email: string) {
    const res = await this.request('POST', '/invoice/sendbyemail', {
      companyVatCode: this.companyVatCode,
      seriesName: series,
      number,
      to: email,
    });
    if (!res.ok) throw new Error(`SmartBill sendInvoiceByEmail: ${res.status}`);
  }

  private request(method: string, path: string, body?: unknown): Promise<Response> {
    const token = btoa(`${this.email}:${this.apiKey}`);
    return fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const smartbillFactory: PluginFactory<SmartBillPlugin> = {
  meta: {
    id: 'smartbill',
    name: 'SmartBill',
    version: '1.0.0',
    description: 'Facturare SmartBill pentru România',
  },
  create: () => new SmartBillPluginImpl(),
};
