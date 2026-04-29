/**
 * Branding Context
 * React context for branding state management
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BrandConfig, BrandContext as BrandContextType } from "./types";
import { brandingLoader } from "./loader";
import { themeManager } from "./theme";

const BrandingContext = createContext<BrandContextType | null>(null);

interface BrandingProviderProps {
  children: ReactNode;
  domain?: string;
}

export function BrandingProvider({ children, domain = "humanex.io" }: BrandingProviderProps) {
  const [brand, setBrand] = useState<BrandConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadBranding() {
      try {
        setIsLoading(true);
        setError(null);

        const brandConfig = await brandingLoader.loadBranding(domain);

        if (mounted) {
          setBrand(brandConfig);
          themeManager.applyTheme(brandConfig);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Failed to load branding"));
          console.error("Failed to load branding:", err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadBranding();

    return () => {
      mounted = false;
    };
  }, [domain]);

  const reload = async () => {
    brandingLoader.clearCache(domain);
    const brandConfig = await brandingLoader.loadBranding(domain);
    setBrand(brandConfig);
    themeManager.applyTheme(brandConfig);
  };

  const value: BrandContextType = {
    brand,
    isLoading,
    error,
    reload,
  };

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

/**
 * Hook to use branding context
 */
export function useBranding(): BrandContextType {
  const context = useContext(BrandingContext);
  
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }

  return context;
}

/**
 * Hook to get current brand config
 */
export function useBrandConfig(): BrandConfig | null {
  const { brand } = useBranding();
  return brand;
}
