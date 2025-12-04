import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ClientSectionHeaderProps {
  title: string;
  count?: number;
  className?: string;
}

export function ClientSectionHeader({ title, count, className }: ClientSectionHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="text-xs h-5 px-1.5">
          {count}
        </Badge>
      )}
    </div>
  );
}
