import type { PluginConfig } from './types';
import { pluginRegistry } from './registry';
import { smartbillFactory } from '../../integrations/smartbill';
import { whatsappFactory } from '../../integrations/whatsapp';
import { emailFactory } from '../../integrations/email';

const FACTORIES = [smartbillFactory, whatsappFactory, emailFactory];

export async function loadPlugins(tenantId: string): Promise<void> {
  for (const factory of FACTORIES) {
    pluginRegistry.register(factory);
  }

  let configs: PluginConfig[] = [];
  try {
    const module = await import(`../../../client-configs/${tenantId}/integrations.json`);
    configs = module.default as PluginConfig[];
  } catch {
    return;
  }

  for (const cfg of configs) {
    if (!cfg.enabled) continue;
    try {
      await pluginRegistry.initialize(cfg.pluginId, cfg.config);
    } catch (err) {
      console.error(`[plugins] Failed to init "${cfg.pluginId}":`, err);
    }
  }
}
