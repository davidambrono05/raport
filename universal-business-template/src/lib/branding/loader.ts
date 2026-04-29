import type { BrandingConfig } from './types';
import { DEFAULT_BRANDING } from './types';

const cache = new Map<string, BrandingConfig>();

export async function loadBranding(tenantId: string): Promise<BrandingConfig> {
  if (cache.has(tenantId)) {
    return cache.get(tenantId)!;
  }

  try {
    const module = await import(`../../../client-configs/${tenantId}/branding.json`);
    const config: BrandingConfig = {
      ...DEFAULT_BRANDING,
      ...module.default,
      colors: { ...DEFAULT_BRANDING.colors, ...module.default.colors },
      typography: { ...DEFAULT_BRANDING.typography, ...module.default.typography },
    };
    cache.set(tenantId, config);
    return config;
  } catch {
    const fallback: BrandingConfig = {
      ...DEFAULT_BRANDING,
      tenantId,
      companyName: tenantId,
    };
    cache.set(tenantId, fallback);
    return fallback;
  }
}

export function clearBrandingCache(tenantId?: string) {
  if (tenantId) {
    cache.delete(tenantId);
  } else {
    cache.clear();
  }
}
