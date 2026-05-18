import type { BrandingConfig } from './types';

export function applyBrandingTheme(config: BrandingConfig): void {
  const root = document.documentElement;
  const { colors, typography } = config;

  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-foreground', colors.primaryForeground);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-secondary-foreground', colors.secondaryForeground);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-accent-foreground', colors.accentForeground);
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-foreground', colors.foreground);
  root.style.setProperty('--color-muted', colors.muted);
  root.style.setProperty('--color-muted-foreground', colors.mutedForeground);
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--color-destructive', colors.destructive);
  root.style.setProperty('--font-family', typography.fontFamily);

  if (typography.fontFamilyMono) {
    root.style.setProperty('--font-family-mono', typography.fontFamilyMono);
  }
}

export function getBrandingCSSVars(config: BrandingConfig): string {
  const { colors, typography } = config;
  return `
    --color-primary: ${colors.primary};
    --color-primary-foreground: ${colors.primaryForeground};
    --color-secondary: ${colors.secondary};
    --color-secondary-foreground: ${colors.secondaryForeground};
    --color-accent: ${colors.accent};
    --color-accent-foreground: ${colors.accentForeground};
    --color-background: ${colors.background};
    --color-foreground: ${colors.foreground};
    --color-muted: ${colors.muted};
    --color-muted-foreground: ${colors.mutedForeground};
    --color-border: ${colors.border};
    --color-destructive: ${colors.destructive};
    --font-family: ${typography.fontFamily};
    ${typography.fontFamilyMono ? `--font-family-mono: ${typography.fontFamilyMono};` : ''}
  `.trim();
}
