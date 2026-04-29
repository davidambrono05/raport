# Ghid Creare Plugin

## Structura unui plugin

```
src/integrations/
└── PLUGIN_NAME/
    └── index.ts
```

## Pași

### 1. Copiază template-ul
```bash
cp -r src/integrations/_template src/integrations/PLUGIN_NAME
```

### 2. Definește interfața

```ts
// src/integrations/PLUGIN_NAME/index.ts
import type { Plugin, PluginFactory } from '../../lib/plugins/types';

export interface MyPlugin extends Plugin {
  sendData(payload: unknown): Promise<{ id: string }>;
}
```

### 3. Implementează clasa

```ts
class MyPluginImpl implements MyPlugin {
  readonly id = 'my-plugin';       // unic în registry
  readonly name = 'My Plugin';
  readonly version = '1.0.0';
  readonly description = '...';

  private apiKey = '';

  async initialize(config: Record<string, string>): Promise<void> {
    if (!config.apiKey) throw new Error('my-plugin: apiKey obligatoriu');
    this.apiKey = config.apiKey;
  }

  async healthCheck(): Promise<boolean> {
    // verifică conexiunea la serviciul extern
    return true;
  }

  async sendData(payload: unknown): Promise<{ id: string }> {
    const res = await fetch('https://api.service.com/endpoint', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`my-plugin sendData: ${res.status}`);
    return res.json() as Promise<{ id: string }>;
  }
}
```

### 4. Exportă factory-ul

```ts
export const myPluginFactory: PluginFactory<MyPlugin> = {
  meta: { id: 'my-plugin', name: 'My Plugin', version: '1.0.0', description: '...' },
  create: () => new MyPluginImpl(),
};
```

### 5. Înregistrează în loader

```ts
// src/lib/plugins/loader.ts
import { myPluginFactory } from '../../integrations/my-plugin';

const FACTORIES = [smartbillFactory, whatsappFactory, emailFactory, myPluginFactory];
```

### 6. Adaugă în config client

```json
// client-configs/TENANT_ID/integrations.json
{
  "pluginId": "my-plugin",
  "enabled": true,
  "config": {
    "apiKey": "..."
  }
}
```

### 7. Utilizare

```ts
import { pluginRegistry } from './src/lib/plugins/registry';
import type { MyPlugin } from './src/integrations/my-plugin';

const plugin = pluginRegistry.get<MyPlugin>('my-plugin');
const result = await plugin.sendData({ ... });
```

## Reguli

- `initialize()` aruncă eroare dacă lipsesc config-uri obligatorii
- `healthCheck()` returnează `false`, nu aruncă eroare
- Nu hardcoda API keys — vin întotdeauna din `config`
- Un plugin = un serviciu extern
