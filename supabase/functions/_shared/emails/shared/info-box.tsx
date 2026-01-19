/** @jsxImportSource https://esm.sh/react@18.3.1 */
import React from 'https://esm.sh/react@18.3.1';
import { Section } from 'https://esm.sh/@react-email/components@0.0.22';
import { colors, fonts, spacing, borderRadius } from './styles.ts';

interface InfoBoxProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlight' | 'warning';
}

/**
 * Box informativo stilizzato per evidenziare dettagli.
 */
export function InfoBox({ children, variant = 'default' }: InfoBoxProps) {
  const backgroundColor = 
    variant === 'highlight' ? colors.backgroundMuted :
    variant === 'warning' ? '#fef3cd' :
    colors.backgroundMuted;
  
  const borderColor =
    variant === 'highlight' ? colors.primary :
    variant === 'warning' ? colors.warning :
    colors.border;

  return (
    <Section
      style={{
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        margin: `${spacing.md} 0`,
        fontFamily: fonts.base,
        fontSize: '14px',
        color: colors.text,
        lineHeight: '1.5',
      }}
    >
      {children}
    </Section>
  );
}
