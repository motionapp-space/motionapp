import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollAffordanceProps {
  /** ref dell'elemento scrollabile (overflow-y-auto) */
  targetRef: React.RefObject<HTMLElement>;
  /** posizione dell'affordance rispetto al blocco fixed */
  placement?: "top" | "bottom";
  /** default true: nasconde l'affordance quando sei "a fondo" */
  hideWhenAtEdge?: boolean;
  className?: string;
}

export function ScrollAffordance({
  targetRef,
  placement = "top",
  hideWhenAtEdge = true,
  className,
}: ScrollAffordanceProps) {
  const [isScrollable, setIsScrollable] = React.useState(false);
  const [isAtEdge, setIsAtEdge] = React.useState(false);

  React.useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const checkScroll = () => {
      const scrollable = el.scrollHeight > el.clientHeight + 1; // +1 for rounding
      setIsScrollable(scrollable);

      if (placement === "top") {
        // "top" means we show affordance above fixed area when there's more content below
        // So we're "at edge" when scrolled to bottom
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
        setIsAtEdge(atBottom);
      } else {
        // "bottom" means we show affordance below header when there's more content above
        // So we're "at edge" when scrolled to top
        const atTop = el.scrollTop <= 1;
        setIsAtEdge(atTop);
      }
    };

    checkScroll();

    el.addEventListener("scroll", checkScroll, { passive: true });

    // ResizeObserver for dynamic content
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(el);
    } else {
      window.addEventListener("resize", checkScroll);
    }

    return () => {
      el.removeEventListener("scroll", checkScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", checkScroll);
      }
    };
  }, [targetRef, placement]);

  const shouldShow = isScrollable && (!hideWhenAtEdge || !isAtEdge);

  if (!shouldShow) return null;

  return (
    <div
      data-testid="scroll-affordance"
      className={cn(
        "pointer-events-none absolute left-0 right-0 z-10",
        placement === "top" && "-top-8 h-8 bg-gradient-to-b from-foreground/[0.06] to-transparent",
        placement === "bottom" && "top-full h-8 bg-gradient-to-t from-foreground/[0.06] to-transparent",
        className
      )}
      aria-hidden="true"
    />
  );
}
