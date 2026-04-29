import type { BrandingConfig } from '../../lib/branding/types';

interface FooterProps {
  branding: BrandingConfig;
}

export function Footer({ branding }: FooterProps) {
  const { contact, social } = branding;
  const year = new Date().getFullYear();

  return (
    <footer
      className="w-full border-t"
      style={{
        backgroundColor: 'var(--color-muted)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {branding.logoUrl && (
              <img src={branding.logoUrl} alt={branding.companyName} className="h-6 w-auto" />
            )}
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--color-foreground)' }}
            >
              {branding.companyName}
            </span>
            {branding.tagline && (
              <span
                className="text-sm"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                — {branding.tagline}
              </span>
            )}
          </div>

          {(contact || social) && (
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              {contact?.phone && <span>{contact.phone}</span>}
              {contact?.email && (
                <a href={`mailto:${contact.email}`} className="hover:opacity-80">
                  {contact.email}
                </a>
              )}
              {social?.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                  Facebook
                </a>
              )}
              {social?.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                  Instagram
                </a>
              )}
            </div>
          )}

          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            © {year} {branding.companyName}
          </p>
        </div>
      </div>
    </footer>
  );
}
