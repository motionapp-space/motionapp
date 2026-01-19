/** @jsxImportSource https://esm.sh/react@18.3.1 */
import React from 'https://esm.sh/react@18.3.1';
import { Button as B } from 'https://esm.sh/@react-email/components@0.0.22';
import { colors, fonts, borderRadius } from './styles.ts';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

/**
 * Componente button/CTA stilizzato per email.
 */
export function Button({ href, children, variant = 'primary' }: ButtonProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <B
      href={href}
      style={{
        backgroundColor: isPrimary ? colors.primary : 'transparent',
        color: isPrimary ? '#ffffff' : colors.primary,
        fontFamily: fonts.base,
        fontSize: '14px',
        fontWeight: 600,
        padding: '12px 24px',
        borderRadius: borderRadius.md,
        textDecoration: 'none',
        display: 'inline-block',
        border: isPrimary ? 'none' : `2px solid ${colors.primary}`,
        textAlign: 'center',
      }}
    >
      {children}
    </B>
  );
}
