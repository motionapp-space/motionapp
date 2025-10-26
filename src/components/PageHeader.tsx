import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  primaryCta?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: ReactNode;
    disabled?: boolean;
    testId?: string;
  };
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;
  className?: string;
};

/**
 * Unified page header component matching the Template section style.
 * Features:
 * - Title + optional subtitle (Montserrat font via design system)
 * - No divider lines (no borders)
 * - Optional primary CTA button aligned right
 * - Optional toolbar area below for filters/actions
 * - Fully responsive with mobile-first approach
 */
export default function PageHeader({
  title,
  subtitle,
  primaryCta,
  toolbarLeft,
  toolbarRight,
  className,
}: PageHeaderProps) {
  const renderCta = () => {
    if (!primaryCta) return null;

    const buttonContent = (
      <>
        {primaryCta.icon}
        {primaryCta.label}
      </>
    );

    const buttonProps = {
      className: "gap-2 h-11",
      disabled: primaryCta.disabled,
      "data-testid": primaryCta.testId,
    };

    if (primaryCta.href) {
      return (
        <Button asChild {...buttonProps}>
          <Link to={primaryCta.href}>{buttonContent}</Link>
        </Button>
      );
    }

    return (
      <Button onClick={primaryCta.onClick} {...buttonProps}>
        {buttonContent}
      </Button>
    );
  };

  return (
    <header
      className={cn("w-full bg-background", className)}
      role="banner"
    >
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Title + CTA Row */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 
              className="text-4xl font-bold mb-2"
              id="page-title"
            >
              {title}
            </h1>
            {subtitle && (
              <p 
                className="text-muted-foreground"
                id="page-subtitle"
                aria-describedby="page-title"
              >
                {subtitle}
              </p>
            )}
          </div>
          {renderCta()}
        </div>

        {/* Optional Toolbar */}
        {(toolbarLeft || toolbarRight) && (
          <div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            role="toolbar"
            aria-label="Page actions"
          >
            {toolbarLeft && (
              <div className="flex-1 w-full md:w-auto">
                {toolbarLeft}
              </div>
            )}
            {toolbarRight && (
              <div className="flex items-center gap-2">
                {toolbarRight}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
