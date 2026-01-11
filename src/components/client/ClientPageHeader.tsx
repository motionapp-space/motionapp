import { cn } from "@/lib/utils";

interface ClientPageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function ClientPageHeader({ title, description, className }: ClientPageHeaderProps) {
  return (
    <header className={cn("mb-6", className)}>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description && (
        <p className="mt-1 text-base text-muted-foreground">{description}</p>
      )}
    </header>
  );
}
