/** @jsxImportSource npm:react@18.3.1 */
import React from 'npm:react@18.3.1';
import { colors, fonts } from './styles.ts';

interface HeadingProps {
  children: React.ReactNode;
}

/**
 * Componente heading per email.
 * Usa h1 HTML puro per evitare conflitti di versioni React.
 */
export function Heading({ children }: HeadingProps) {
  return (
    <h1 style={headingStyle}>
      {children}
    </h1>
  );
}

const headingStyle: React.CSSProperties = {
  color: colors.text,
  fontFamily: fonts.base,
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px 0',
  lineHeight: 1.3,
};
