import type { BrandingConfig } from '../../lib/branding/types';

interface HeaderProps {
  branding: BrandingConfig;
  navItems?: Array<{ label: string; href: string }>;
  actions?: React.ReactNode;
}

export function Header({ branding, navItems = [], actions }: HeaderProps) {
  return (
    <header
      className="w-full border-b"
      style={{
        backgroundColor: 'var(--color-background)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.companyName}
                className="h-8 w-auto"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-foreground)',
                }}
              >
                {branding.companyName.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className="text-lg font-semibold"
              style={{ color: 'var(--color-foreground)' }}
            >
              {branding.companyName}
            </span>
          </div>

          {navItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
