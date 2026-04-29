/**
 * Branding Loader
 * Loads and caches branding configuration per client/domain
 */

import { BrandConfig } from "./types";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = "branding_";

interface CacheEntry {
  data: BrandConfig;
  timestamp: number;
}

class BrandingLoader {
  private cache: Map<string, CacheEntry> = new Map();
  private loadingPromises: Map<string, Promise<BrandConfig>> = new Map();

  /**
   * Get branding configuration for a domain/client
   */
  async loadBranding(domain: string): Promise<BrandConfig> {
    const cacheKey = `${CACHE_KEY_PREFIX}${domain}`;

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Load fresh data
    const promise = this.fetchBranding(domain);
    this.loadingPromises.set(cacheKey, promise);

    try {
      const data = await promise;
      
      // Update cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Fetch branding from API or return default
   */
  private async fetchBranding(domain: string): Promise<BrandConfig> {
    try {
      // Try to fetch from API
      const response = await fetch(`/api/branding/${encodeURIComponent(domain)}`);
      
      if (response.ok) {
        const data = await response.json();
        return this.validateBrandConfig(data);
      }
    } catch (error) {
      console.warn(`Failed to fetch branding for ${domain}:`, error);
    }

    // Return default branding
    return this.getDefaultBranding();
  }

  /**
   * Validate and sanitize branding config
   */
  private validateBrandConfig(config: any): BrandConfig {
    // Basic validation - ensure required fields exist
    if (!config.id || !config.name || !config.colors) {
      console.warn("Invalid branding config, using defaults");
      return this.getDefaultBranding();
    }

    return config as BrandConfig;
  }

  /**
   * Get default HUMANEX branding
   */
  private getDefaultBranding(): BrandConfig {
    return {
      id: "humanex",
      name: "HUMANEX",
      domain: "humanex.io",
      colors: {
        primary: "oklch(0.78 0.13 85)",
        primaryForeground: "oklch(0.15 0.01 270)",
        secondary: "oklch(0.22 0.012 270)",
        secondaryForeground: "oklch(0.98 0 0)",
        accent: "oklch(0.78 0.13 85)",
        accentForeground: "oklch(0.15 0.01 270)",
        background: "oklch(0.13 0.01 270)",
        foreground: "oklch(0.98 0 0)",
        surface: "oklch(0.17 0.012 270)",
        surfaceElevated: "oklch(0.21 0.014 270)",
        border: "oklch(0.27 0.012 270)",
        muted: "oklch(0.22 0.012 270)",
        mutedForeground: "oklch(0.65 0.01 270)",
        destructive: "oklch(0.62 0.22 25)",
        destructiveForeground: "oklch(0.98 0 0)",
        bull: "oklch(0.72 0.18 145)",
        bear: "oklch(0.65 0.22 25)",
        gold: "oklch(0.78 0.13 85)",
        goldSoft: "oklch(0.78 0.13 85 / 0.15)",
      },
      typography: {
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        displayFont: "Inter, ui-sans-serif, system-ui, sans-serif",
        monoFont: "JetBrains Mono, ui-monospace, monospace",
        fontSize: {
          xs: "0.75rem",
          sm: "0.875rem",
          base: "1rem",
          lg: "1.125rem",
          xl: "1.25rem",
          "2xl": "1.5rem",
          "3xl": "1.875rem",
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
      },
      radius: {
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        full: "9999px",
      },
      shadows: {
        card: "0 1px 0 oklch(1 0 0 / 0.04) inset, 0 8px 24px -12px oklch(0 0 0 / 0.6)",
        glow: "0 0 0 1px oklch(0.78 0.13 85 / 0.3), 0 8px 32px -8px oklch(0.78 0.13 85 / 0.25)",
        elevated: "0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -1px oklch(0 0 0 / 0.06)",
      },
      gradients: {
        primary: "linear-gradient(135deg, oklch(0.82 0.13 85), oklch(0.68 0.12 70))",
        surface: "linear-gradient(180deg, oklch(0.19 0.012 270), oklch(0.15 0.012 270))",
        accent: "linear-gradient(135deg, oklch(0.78 0.13 85), oklch(0.72 0.18 145))",
      },
      logo: {
        text: "HUMANEX",
        icon: "H",
      },
      footer: {
        enabled: true,
        text: "The Human Stock Exchange",
        links: [
          { label: "About", url: "/about" },
          { label: "Terms", url: "/terms" },
          { label: "Privacy", url: "/privacy" },
        ],
        copyright: "© 2026 HUMANEX. All rights reserved.",
      },
      features: {
        darkMode: true,
        animations: true,
        glassmorphism: true,
      },
    };
  }

  /**
   * Clear cache for a specific domain
   */
  clearCache(domain: string): void {
    const cacheKey = `${CACHE_KEY_PREFIX}${domain}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: Array<{ key: string; age: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

// Singleton instance
export const brandingLoader = new BrandingLoader();

/**
 * Hook to load branding for current domain
 */
export async function loadBrandingForDomain(domain: string): Promise<BrandConfig> {
  return brandingLoader.loadBranding(domain);
}
