/** @jsxImportSource https://esm.sh/react@18.3.1 */
import React from 'https://esm.sh/react@18.3.1';
import {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Section,
  Img,
} from 'https://esm.sh/@react-email/components@0.0.22';
import { colors, fonts, spacing } from './styles.ts';

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
}

/**
 * Layout wrapper comune per tutte le email.
 * Include header con logo, contenuto e footer.
 */
export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Img
              src="https://qadgzwsmiadxwwvsrauz.supabase.co/storage/v1/object/public/assets/logo.png"
              alt="Studio AI"
              width="120"
              height="auto"
              style={{ margin: '0 auto' }}
            />
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <p style={footerTextStyle}>
              Questa email è stata inviata da Studio AI.
            </p>
            <p style={footerTextStyle}>
              © {new Date().getFullYear()} Studio AI. Tutti i diritti riservati.
            </p>
          </Section>
        </Container>
      </Body>
    </Html>
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
};

const headerStyle: React.CSSProperties = {
  backgroundColor: colors.background,
  padding: spacing.lg,
  textAlign: 'center',
  borderBottom: `1px solid ${colors.border}`,
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
