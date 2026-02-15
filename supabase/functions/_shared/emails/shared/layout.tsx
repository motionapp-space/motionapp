/** @jsxImportSource npm:react@18.3.1 */
import React from 'npm:react@18.3.1';
import { colors, fonts, spacing } from './styles.ts';

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
}

/**
 * Layout wrapper comune per tutte le email.
 * Include header con logo testuale "Motion", contenuto e footer.
 * Header con sfondo "Dark Signature" (Ink) coerente con la sidebar dell'app.
 */
export function Layout({ preview, children }: LayoutProps) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{preview}</title>
        {/* Preview text for email clients */}
        <span style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
          {preview}
        </span>
      </head>
      <body style={bodyStyle}>
        <table
          role="presentation"
          cellPadding="0"
          cellSpacing="0"
          style={containerStyle}
        >
          {/* Header */}
          <tbody>
            <tr>
              <td style={headerStyle}>
                <span style={logoStyle}>Motion</span>
              </td>
            </tr>
            
            {/* Content */}
            <tr>
              <td style={contentStyle}>
                {children}
              </td>
            </tr>
            
            {/* Footer */}
            <tr>
              <td style={footerStyle}>
                <p style={footerTextStyle}>
                  Questa email è stata inviata da Motion.
                </p>
                <p style={footerTextStyle}>
                  © {new Date().getFullYear()} Motion. Tutti i diritti riservati.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: colors.backgroundMuted,
  fontFamily: fonts.base,
  margin: 0,
  padding: spacing.lg,
};

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: colors.background,
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  width: '100%',
};

const headerStyle: React.CSSProperties = {
  backgroundColor: colors.primary,
  padding: spacing.lg,
  textAlign: 'center',
};

const logoStyle: React.CSSProperties = {
  color: '#ffffff',
  fontFamily: fonts.base,
  fontSize: '22px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  textDecoration: 'none',
};

const contentStyle: React.CSSProperties = {
  padding: spacing.xl,
};

const footerStyle: React.CSSProperties = {
  backgroundColor: colors.backgroundMuted,
  padding: spacing.lg,
  textAlign: 'center',
  borderTop: `1px solid ${colors.border}`,
};

const footerTextStyle: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: '12px',
  margin: '4px 0',
  fontFamily: fonts.base,
};
