/**
 * MOTION DESIGN SYSTEM — TypeScript Token Export
 * For audit, storybook, and linting.
 * Source of truth is src/styles/motion-tokens.css
 */

export const motionTokens = {
  surfaces: {
    background: "220 14% 98%",
    card: "220 14% 98%",
    popover: "220 14% 98%",
    muted: "220 12% 96%",
    secondary: "0 0% 100%",
  },
  ink: {
    foreground: "220 15% 6%",
    "ink-900": "220 15% 8%",
    "ink-700": "220 10% 30%",
    "muted-foreground": "220 8% 48%",
  },
  primary: {
    primary: "220 15% 10%",
    "primary-hover": "220 15% 6%",
    "primary-foreground": "0 0% 100%",
  },
  accent: {
    accent: "222 35% 68%",
    "accent-hover": "222 35% 60%",
    "accent-foreground": "0 0% 100%",
    "accent-soft-2": "222 35% 68% / 0.35",
    "accent-soft-4": "222 35% 68% / 0.55",
    "accent-soft-6": "222 35% 68% / 0.70",
    "selection-border": "222 35% 68% / 0.50",
  },
  semantic: {
    destructive: "0 72% 51%",
    "destructive-foreground": "0 0% 100%",
    success: "150 60% 40%",
    "success-foreground": "0 0% 100%",
    warning: "38 92% 50%",
    "warning-foreground": "220 15% 6%",
  },
  borders: {
    border: "220 15% 90%",
    input: "220 15% 90%",
    ring: "222 35% 68%",
  },
  sidebar: {
    "sidebar-background": "220 15% 6%",
    "sidebar-foreground": "0 0% 90%",
    "sidebar-primary": "0 0% 100%",
    "sidebar-primary-foreground": "220 15% 8%",
    "sidebar-accent": "220 12% 16%",
    "sidebar-accent-foreground": "0 0% 90%",
    "sidebar-border": "220 12% 18%",
    "sidebar-ring": "222 35% 68%",
    "sidebar-active": "220 12% 18%",
    "sidebar-item-hover": "220 12% 16%",
    "sidebar-muted": "220 10% 65%",
  },
} as const;
