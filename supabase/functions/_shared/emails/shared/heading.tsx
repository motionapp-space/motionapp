/** @jsxImportSource https://esm.sh/react@18.3.1 */
import React from 'https://esm.sh/react@18.3.1';
import { Heading as H } from 'https://esm.sh/@react-email/components@0.0.22';
import { colors, fonts } from './styles.ts';

interface HeadingProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
}

/**
 * Componente heading stilizzato per email.
 */
export function Heading({ children, as = 'h1' }: HeadingProps) {
  const fontSize = as === 'h1' ? '24px' : as === 'h2' ? '20px' : '16px';
  
  return (
    <H
      as={as}
      style={{
        color: colors.text,
        fontFamily: fonts.base,
        fontSize,
        fontWeight: 'bold',
        margin: '0 0 24px 0',
        lineHeight: '1.3',
      }}
    >
      {children}
    </H>
  );
}
