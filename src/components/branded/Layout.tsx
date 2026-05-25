import { useEffect, useState } from 'react';
import type { BrandingConfig } from '../../lib/branding/types';
import { loadBranding } from '../../lib/branding/loader';
import { applyBrandingTheme } from '../../lib/branding/theme';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  tenantId: string;
  children: React.ReactNode;
  navItems?: Array<{ label: string; href: string }>;
  headerActions?: React.ReactNode;
  showFooter?: boolean;
}

export function Layout({
  tenantId,
  children,
  navItems,
  headerActions,
  showFooter = true,
}: LayoutProps) {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);

  useEffect(() => {
    loadBranding(tenantId).then((config) => {
      applyBrandingTheme(config);
      setBranding(config);
    });
  }, [tenantId]);

  if (!branding) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-foreground)',
        fontFamily: 'var(--font-family)',
      }}
    >
      <Header branding={branding} navItems={navItems} actions={headerActions} />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer branding={branding} />}
    </div>
  );
}
