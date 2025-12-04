import { cn } from "@/lib/utils";

interface ClientPageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function ClientPageHeader({ title, description, className }: ClientPageHeaderProps) {
  return (
    <header className={cn("space-y-1", className)}>
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </header>
  );
}
