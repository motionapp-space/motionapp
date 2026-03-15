import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ['Montserrat', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      heading: ['"Disket Mono"', 'monospace'],
      montserrat: ['Montserrat', 'sans-serif'],
      nunito: ['Nunito', 'sans-serif'],
    },
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      fontSize: {
        xs: ['12px', { lineHeight: '1.4' }],
        sm: ['14px', { lineHeight: '1.45' }],
        base: ['16px', { lineHeight: '1.6' }],
        md: ['18px', { lineHeight: '1.6' }],
        lg: ['20px', { lineHeight: '1.5' }],
        h6: ['24px', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        h5: ['28px', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        h4: ['32px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        h3: ['36px', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        h2: ['40px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        h1: ['44px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      spacing: {
        0: '0px',
        0.5: '2px',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        10: '40px',
        12: '48px',
        14: '56px',
        16: '64px',
        20: '80px',
        24: '96px',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        "ink-900": "hsl(var(--ink-900))",
        "ink-700": "hsl(var(--ink-700))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          hover: "hsl(var(--accent-hover))",
          strong: "hsl(var(--accent-strong))",
          surface: "hsl(var(--accent-surface))",
          "surface-border": "hsl(var(--accent-surface-border))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          active: "hsl(var(--sidebar-active))",
          "item-hover": "hsl(var(--sidebar-item-hover))",
          muted: "hsl(var(--sidebar-muted))",
        },
        "client-1": "hsl(var(--client-1))",
        "client-2": "hsl(var(--client-2))",
        "client-3": "hsl(var(--client-3))",
        "client-4": "hsl(var(--client-4))",
        "client-5": "hsl(var(--client-5))",
        "client-6": "hsl(var(--client-6))",
        "client-7": "hsl(var(--client-7))",
        "client-8": "hsl(var(--client-8))",
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: 'var(--radius)',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.06)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 8px 24px rgba(0,0,0,0.10)',
      },
      screens: {
        sm: '640px',
        md: '768px',   // tablet+ (min-width)
        lg: '992px',   // desktop-small+ (min-width)
        xl: '1200px',  // desktop-large+ (min-width)
        '2xl': '1440px',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
