import { cn } from "@/lib/utils";

interface ClientPageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function ClientPageHeader({ title, description, className }: ClientPageHeaderProps) {
  return (
    <header className={cn("mb-4", className)}>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description && (
        <p className="mt-0.5 text-[15px] leading-6 text-muted-foreground">{description}</p>
      )}
    </header>
  );
}
