/**
 * Theme System
 * Manages CSS variables and theme application for branding
 */

import { BrandConfig } from "./types";

export class ThemeManager {
  private styleElement: HTMLStyleElement | null = null;
  private currentBrand: BrandConfig | null = null;

  /**
   * Apply branding theme to document
   */
  applyTheme(brand: BrandConfig): void {
    this.currentBrand = brand;
    this.injectCSSVariables(brand);
    this.injectCustomCSS(brand);
  }

  /**
   * Inject CSS variables from brand config
   */
  private injectCSSVariables(brand: BrandConfig): void {
    const root = document.documentElement;

    // Colors
    this.setVariable(root, "--brand-primary", brand.colors.primary);
    this.setVariable(root, "--brand-primary-foreground", brand.colors.primaryForeground);
    this.setVariable(root, "--brand-secondary", brand.colors.secondary);
    this.setVariable(root, "--brand-secondary-foreground", brand.colors.secondaryForeground);
    this.setVariable(root, "--brand-accent", brand.colors.accent);
    this.setVariable(root, "--brand-accent-foreground", brand.colors.accentForeground);
    this.setVariable(root, "--brand-background", brand.colors.background);
    this.setVariable(root, "--brand-foreground", brand.colors.foreground);
    this.setVariable(root, "--brand-surface", brand.colors.surface);
    this.setVariable(root, "--brand-surface-elevated", brand.colors.surfaceElevated);
    this.setVariable(root, "--brand-border", brand.colors.border);
    this.setVariable(root, "--brand-muted", brand.colors.muted);
    this.setVariable(root, "--brand-muted-foreground", brand.colors.mutedForeground);
    this.setVariable(root, "--brand-destructive", brand.colors.destructive);
    this.setVariable(root, "--brand-destructive-foreground", brand.colors.destructiveForeground);
    this.setVariable(root, "--brand-bull", brand.colors.bull);
    this.setVariable(root, "--brand-bear", brand.colors.bear);
    this.setVariable(root, "--brand-gold", brand.colors.gold);
    this.setVariable(root, "--brand-gold-soft", brand.colors.goldSoft);

    // Typography
    this.setVariable(root, "--brand-font-family", brand.typography.fontFamily);
    this.setVariable(root, "--brand-font-display", brand.typography.displayFont);
    this.setVariable(root, "--brand-font-mono", brand.typography.monoFont);

    // Spacing
    this.setVariable(root, "--brand-spacing-xs", brand.spacing.xs);
    this.setVariable(root, "--brand-spacing-sm", brand.spacing.sm);
    this.setVariable(root, "--brand-spacing-md", brand.spacing.md);
    this.setVariable(root, "--brand-spacing-lg", brand.spacing.lg);
    this.setVariable(root, "--brand-spacing-xl", brand.spacing.xl);
    this.setVariable(root, "--brand-spacing-2xl", brand.spacing["2xl"]);

    // Radius
    this.setVariable(root, "--brand-radius-sm", brand.radius.sm);
    this.setVariable(root, "--brand-radius-md", brand.radius.md);
    this.setVariable(root, "--brand-radius-lg", brand.radius.lg);
    this.setVariable(root, "--brand-radius-xl", brand.radius.xl);
    this.setVariable(root, "--brand-radius-full", brand.radius.full);

    // Shadows
    this.setVariable(root, "--brand-shadow-card", brand.shadows.card);
    this.setVariable(root, "--brand-shadow-glow", brand.shadows.glow);
    this.setVariable(root, "--brand-shadow-elevated", brand.shadows.elevated);

    // Gradients
    this.setVariable(root, "--brand-gradient-primary", brand.gradients.primary);
    this.setVariable(root, "--brand-gradient-surface", brand.gradients.surface);
    this.setVariable(root, "--brand-gradient-accent", brand.gradients.accent);

    // Update Tailwind color mappings
    this.updateTailwindColors(brand);
  }

  /**
   * Update Tailwind color variables
   */
  private updateTailwindColors(brand: BrandConfig): void {
    const root = document.documentElement;

    // Map brand colors to Tailwind variables
    this.setVariable(root, "--primary", brand.colors.primary);
    this.setVariable(root, "--primary-foreground", brand.colors.primaryForeground);
    this.setVariable(root, "--secondary", brand.colors.secondary);
    this.setVariable(root, "--secondary-foreground", brand.colors.secondaryForeground);
    this.setVariable(root, "--accent", brand.colors.accent);
    this.setVariable(root, "--accent-foreground", brand.colors.accentForeground);
    this.setVariable(root, "--background", brand.colors.background);
    this.setVariable(root, "--foreground", brand.colors.foreground);
    this.setVariable(root, "--card", brand.colors.surface);
    this.setVariable(root, "--card-foreground", brand.colors.foreground);
    this.setVariable(root, "--popover", brand.colors.surface);
    this.setVariable(root, "--popover-foreground", brand.colors.foreground);
    this.setVariable(root, "--muted", brand.colors.muted);
    this.setVariable(root, "--muted-foreground", brand.colors.mutedForeground);
    this.setVariable(root, "--destructive", brand.colors.destructive);
    this.setVariable(root, "--destructive-foreground", brand.colors.destructiveForeground);
    this.setVariable(root, "--border", brand.colors.border);
    this.setVariable(root, "--input", brand.colors.border);
    this.setVariable(root, "--ring", brand.colors.primary);
    this.setVariable(root, "--gold", brand.colors.gold);
    this.setVariable(root, "--gold-soft", brand.colors.goldSoft);
    this.setVariable(root, "--bull", brand.colors.bull);
    this.setVariable(root, "--bear", brand.colors.bear);
    this.setVariable(root, "--surface", brand.colors.surface);
    this.setVariable(root, "--surface-elevated", brand.colors.surfaceElevated);

    // Update gradients
    this.setVariable(root, "--gradient-gold", brand.gradients.primary);
    this.setVariable(root, "--gradient-surface", brand.gradients.surface);
    this.setVariable(root, "--shadow-card", brand.shadows.card);
    this.setVariable(root, "--shadow-glow", brand.shadows.glow);
  }

  /**
   * Inject custom CSS from brand config
   */
  private injectCustomCSS(brand: BrandConfig): void {
    // Remove old style element
    if (this.styleElement) {
      this.styleElement.remove();
    }

    // Create new style element if custom CSS exists
    if (brand.customCss) {
      this.styleElement = document.createElement("style");
      this.styleElement.setAttribute("data-branding", "custom");
      this.styleElement.textContent = brand.customCss;
      document.head.appendChild(this.styleElement);
    }
  }

  /**
   * Set CSS variable on element
   */
  private setVariable(element: HTMLElement, name: string, value: string): void {
    element.style.setProperty(name, value);
  }

  /**
   * Get current brand config
   */
  getCurrentBrand(): BrandConfig | null {
    return this.currentBrand;
  }

  /**
   * Reset to default theme
   */
  resetTheme(): void {
    const root = document.documentElement;

    // Remove all brand variables
    const variables = Array.from(root.style).filter((prop) => prop.startsWith("--brand-"));
    variables.forEach((variable) => {
      root.style.removeProperty(variable);
    });

    // Remove custom CSS
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    this.currentBrand = null;
  }

  /**
   * Get CSS variable value
   */
  getVariable(name: string): string | null {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || null;
  }
}

// Singleton instance
export const themeManager = new ThemeManager();

/**
 * Apply branding theme to document
 */
export function applyBrandingTheme(brand: BrandConfig): void {
  themeManager.applyTheme(brand);
}

/**
 * Get current branding theme
 */
export function getCurrentBrandingTheme(): BrandConfig | null {
  return themeManager.getCurrentBrand();
}

/**
 * Reset branding theme
 */
export function resetBrandingTheme(): void {
  themeManager.resetTheme();
}
