export interface BrandingColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  destructive: string;
}

export interface BrandingTypography {
  fontFamily: string;
  fontFamilyMono?: string;
}

export interface BrandingContact {
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}

export interface BrandingSocial {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
}

export interface BrandingConfig {
  tenantId: string;
  companyName: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  colors: BrandingColors;
  typography: BrandingTypography;
  contact?: BrandingContact;
  social?: BrandingSocial;
}

export const DEFAULT_BRANDING: Omit<BrandingConfig, 'tenantId' | 'companyName'> = {
  colors: {
    primary: '#2563eb',
    primaryForeground: '#ffffff',
    secondary: '#f1f5f9',
    secondaryForeground: '#0f172a',
    accent: '#f1f5f9',
    accentForeground: '#0f172a',
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
    border: '#e2e8f0',
    destructive: '#ef4444',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
};
