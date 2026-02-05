import * as React from "react";

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PanelHeader({ title, subtitle, action }: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4" data-testid="panel-header">
      <div>
        <h2 className="text-[19px] font-semibold leading-6 text-foreground" data-testid="panel-header-title">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm font-medium text-muted-foreground mt-1 leading-5" data-testid="panel-header-subtitle">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0" data-testid="panel-header-action">
          {action}
        </div>
      )}
    </div>
  );
}
