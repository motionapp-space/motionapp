/** @jsxImportSource https://esm.sh/react@18.3.1 */
import React from 'https://esm.sh/react@18.3.1';
import { colors, fonts } from './styles.ts';

interface TextProps {
  children: React.ReactNode;
  muted?: boolean;
  small?: boolean;
}

/**
 * Componente text per email.
 * Usa p HTML puro per evitare conflitti di versioni React.
 */
export function Text({ children, muted, small }: TextProps) {
  return (
    <p style={{
      ...textStyle,
      color: muted ? colors.textMuted : colors.text,
      fontSize: small ? '12px' : '14px',
      lineHeight: small ? '20px' : '24px',
    }}>
      {children}
    </p>
  );
}

const textStyle: React.CSSProperties = {
  fontFamily: fonts.base,
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
};
