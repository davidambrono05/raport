/**
 * Branding Types and Interfaces
 * Type-safe branding configuration for multi-tenant support
 */

export interface BrandColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  destructiveForeground: string;
  bull: string;
  bear: string;
  gold: string;
  goldSoft: string;
}

export interface BrandTypography {
  fontFamily: string;
  displayFont: string;
  monoFont: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

export interface BrandSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
}

export interface BrandRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface BrandShadows {
  card: string;
  glow: string;
  elevated: string;
}

export interface BrandGradients {
  primary: string;
  surface: string;
  accent: string;
}

export interface BrandLogo {
  text: string;
  icon: string;
  url?: string;
  width?: number;
  height?: number;
}

export interface BrandFooter {
  enabled: boolean;
  text?: string;
  links?: Array<{
    label: string;
    url: string;
    external?: boolean;
  }>;
  copyright?: string;
}

export interface BrandConfig {
  id: string;
  name: string;
  domain?: string;
  colors: BrandColors;
  typography: BrandTypography;
  spacing: BrandSpacing;
  radius: BrandRadius;
  shadows: BrandShadows;
  gradients: BrandGradients;
  logo: BrandLogo;
  footer: BrandFooter;
  customCss?: string;
  features?: {
    darkMode?: boolean;
    animations?: boolean;
    glassmorphism?: boolean;
  };
}

export type BrandTheme = "light" | "dark" | "auto";

export interface BrandContext {
  brand: BrandConfig | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}
