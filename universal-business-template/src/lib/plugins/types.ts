export interface PluginMeta {
  id: string;
  name: string;
  version: string;
  description: string;
}

export interface Plugin extends PluginMeta {
  initialize(config: Record<string, string>): Promise<void>;
  healthCheck(): Promise<boolean>;
  destroy?(): Promise<void>;
}

export interface PluginConfig {
  pluginId: string;
  enabled: boolean;
  config: Record<string, string>;
}

export interface PluginFactory<T extends Plugin = Plugin> {
  meta: PluginMeta;
  create(): T;
}

export type PluginStatus = 'unregistered' | 'registered' | 'initialized' | 'error';

export interface PluginEntry {
  factory: PluginFactory;
  instance?: Plugin;
  status: PluginStatus;
  error?: string;
}
