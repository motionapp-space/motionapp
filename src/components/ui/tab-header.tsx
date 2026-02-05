import * as React from "react";

interface TabHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function TabHeader({ title, subtitle, action }: TabHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4" data-testid="tab-header">
      <div>
        <h2 className="text-lg font-semibold" data-testid="tab-header-title">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1" data-testid="tab-header-subtitle">
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
