import * as React from "react";

export interface TabHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function TabHeader({ title, subtitle, action }: TabHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4" data-testid="tab-header">
      <div>
        <h2 className="text-[19px] font-semibold leading-6" data-testid="tab-header-title">
          {title}
        </h2>
        <p className="text-sm font-medium text-muted-foreground mt-1 leading-5" data-testid="tab-header-subtitle">
          {subtitle}
        </p>
      </div>
      {action && (
        <div className="shrink-0" data-testid="tab-header-action">
          {action}
        </div>
      )}
    </div>
  );
}
