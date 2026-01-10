import { useState, useEffect } from "react";

/**
 * Responsive layout breakpoints:
 * - desktop-large: ≥ 1200px (xl+)
 * - desktop-small: 992px - 1199px (lg to xl)
 * - tablet: 768px - 991px (md to lg)
 * - mobile: < 768px (< md)
 */
export type LayoutMode = "desktop-large" | "desktop-small" | "tablet" | "mobile";

export interface ResponsiveLayout {
  mode: LayoutMode;
  isDesktopLarge: boolean;
  isDesktopSmall: boolean;
  isTablet: boolean;
  isMobile: boolean;
}

const BREAKPOINTS = {
  md: 768,
  lg: 992,
  xl: 1200,
} as const;

function getLayoutMode(width: number): LayoutMode {
  if (width >= BREAKPOINTS.xl) return "desktop-large";
  if (width >= BREAKPOINTS.lg) return "desktop-small";
  if (width >= BREAKPOINTS.md) return "tablet";
  return "mobile";
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [mode, setMode] = useState<LayoutMode>(() => {
    if (typeof window === "undefined") return "desktop-large";
    return getLayoutMode(window.innerWidth);
  });

  useEffect(() => {
    const handleResize = () => {
      setMode(getLayoutMode(window.innerWidth));
    };

    // Use matchMedia for better performance
    const mediaQueries = [
      window.matchMedia(`(min-width: ${BREAKPOINTS.xl}px)`),
      window.matchMedia(`(min-width: ${BREAKPOINTS.lg}px)`),
      window.matchMedia(`(min-width: ${BREAKPOINTS.md}px)`),
    ];

    const handleChange = () => handleResize();

    mediaQueries.forEach((mq) => {
      mq.addEventListener("change", handleChange);
    });

    // Initial check
    handleResize();

    return () => {
      mediaQueries.forEach((mq) => {
        mq.removeEventListener("change", handleChange);
      });
    };
  }, []);

  return {
    mode,
    isDesktopLarge: mode === "desktop-large",
    isDesktopSmall: mode === "desktop-small",
    isTablet: mode === "tablet",
    isMobile: mode === "mobile",
  };
}
