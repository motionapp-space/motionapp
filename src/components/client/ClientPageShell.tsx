import { cn } from "@/lib/utils";

interface ClientPageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function ClientPageShell({ children, className }: ClientPageShellProps) {
  return (
    <div className={cn(
      "px-4 py-5 space-y-6 pb-24",
      className
    )}>
      {children}
    </div>
  );
}
