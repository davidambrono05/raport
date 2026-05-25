import type { Plugin, PluginEntry, PluginFactory } from './types';

class PluginRegistry {
  private entries = new Map<string, PluginEntry>();

  register(factory: PluginFactory): void {
    if (this.entries.has(factory.meta.id)) return;
    this.entries.set(factory.meta.id, { factory, status: 'registered' });
  }

  async initialize(pluginId: string, config: Record<string, string>): Promise<void> {
    const entry = this.entries.get(pluginId);
    if (!entry) throw new Error(`Plugin "${pluginId}" not registered`);
    if (entry.status === 'initialized') return;

    try {
      const instance = entry.factory.create();
      await instance.initialize(config);
      entry.instance = instance;
      entry.status = 'initialized';
    } catch (err) {
      entry.status = 'error';
      entry.error = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  get<T extends Plugin>(pluginId: string): T {
    const entry = this.entries.get(pluginId);
    if (!entry?.instance || entry.status !== 'initialized') {
      throw new Error(`Plugin "${pluginId}" is not initialized`);
    }
    return entry.instance as T;
  }

  has(pluginId: string): boolean {
    return this.entries.get(pluginId)?.status === 'initialized';
  }

  list(): Array<{ id: string; name: string; status: string }> {
    return Array.from(this.entries.values()).map((e) => ({
      id: e.factory.meta.id,
      name: e.factory.meta.name,
      status: e.status,
    }));
  }

  async destroyAll(): Promise<void> {
    for (const entry of this.entries.values()) {
      if (entry.instance?.destroy) {
        await entry.instance.destroy();
      }
    }
    this.entries.clear();
  }
}

export const pluginRegistry = new PluginRegistry();
