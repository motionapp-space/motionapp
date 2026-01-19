/** @jsxImportSource https://esm.sh/react@18.3.1 */
import React from 'https://esm.sh/react@18.3.1';
import { Text as T } from 'https://esm.sh/@react-email/components@0.0.22';
import { colors, fonts } from './styles.ts';

interface TextProps {
  children: React.ReactNode;
  muted?: boolean;
  small?: boolean;
}

/**
 * Componente testo stilizzato per email.
 */
export function Text({ children, muted, small }: TextProps) {
  return (
    <T
      style={{
        color: muted ? colors.textMuted : colors.text,
        fontFamily: fonts.base,
        fontSize: small ? '12px' : '14px',
        lineHeight: '24px',
        margin: '0 0 16px 0',
      }}
    >
      {children}
    </T>
  );
}
