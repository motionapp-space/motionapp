/** @jsxImportSource https://esm.sh/react@18.3.1 */
import React from 'https://esm.sh/react@18.3.1';
import { colors, fonts, spacing, borderRadius } from './styles.ts';

interface InfoBoxProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlight' | 'warning';
}

/**
 * Box informativo per dettagli appuntamento, ecc.
 * Usa div HTML puro per evitare conflitti di versioni React.
 */
export function InfoBox({ children, variant = 'default' }: InfoBoxProps) {
  let backgroundColor = colors.backgroundMuted;
  let borderColor = colors.border;
  
  if (variant === 'highlight') {
    backgroundColor = '#e8f0fe'; // Light blue
    borderColor = colors.primary;
  } else if (variant === 'warning') {
    backgroundColor = '#fff3e0'; // Light orange
    borderColor = '#f57c00';
  }
  
  return (
    <div style={{
      backgroundColor,
      border: `1px solid ${borderColor}`,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      margin: `${spacing.md} 0`,
      fontFamily: fonts.base,
      fontSize: '14px',
      lineHeight: '22px',
      color: colors.text,
    }}>
      {children}
    </div>
  );
}
