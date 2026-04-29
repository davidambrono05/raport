import type { Plugin, PluginFactory } from '../../lib/plugins/types';

// ─────────────────────────────────────────────────────────
// 1. Definește interfața pluginului tău
// ─────────────────────────────────────────────────────────
export interface MyPlugin extends Plugin {
  doSomething(input: string): Promise<string>;
}

// ─────────────────────────────────────────────────────────
// 2. Implementează pluginul
// ─────────────────────────────────────────────────────────
class MyPluginImpl implements MyPlugin {
  readonly id = 'my-plugin';          // unic în registry
  readonly name = 'My Plugin';
  readonly version = '1.0.0';
  readonly description = 'Descrie ce face pluginul';

  private apiKey = '';

  async initialize(config: Record<string, string>): Promise<void> {
    if (!config.apiKey) throw new Error('MyPlugin: apiKey este obligatoriu');
    this.apiKey = config.apiKey;
    // orice setup inițial (conexiuni, validări)
  }

  async healthCheck(): Promise<boolean> {
    // returnează true dacă serviciul extern răspunde
    return true;
  }

  async doSomething(input: string): Promise<string> {
    // implementare reală
    return `processed: ${input}`;
  }

  async destroy(): Promise<void> {
    // opțional: curăță conexiuni, timere etc.
  }
}

// ─────────────────────────────────────────────────────────
// 3. Exportă factory-ul
// ─────────────────────────────────────────────────────────
export const myPluginFactory: PluginFactory<MyPlugin> = {
  meta: {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    description: 'Descrie ce face pluginul',
  },
  create: () => new MyPluginImpl(),
};

// ─────────────────────────────────────────────────────────
// 4. Înregistrează în src/lib/plugins/loader.ts:
//    import { myPluginFactory } from '../../integrations/my-plugin';
//    const FACTORIES = [..., myPluginFactory];
//
// 5. Adaugă în client-configs/<tenantId>/integrations.json:
//    { "pluginId": "my-plugin", "enabled": true, "config": { "apiKey": "..." } }
// ─────────────────────────────────────────────────────────
