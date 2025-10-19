import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: React.ReactNode;
};

export function IconTooltipButton({ label, className, children, ...btn }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          {...btn}
          className={cn(
            "inline-flex items-center justify-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
            className
          )}
          aria-label={label}
          data-testid={btn["data-testid"] ?? undefined}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
