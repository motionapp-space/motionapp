import { format, parseISO, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ClientPackageOption } from "../types";

interface PaymentCoverageSectionProps {
  packages: ClientPackageOption[];
  isLoading: boolean;
  selectedPackageId: string | null;
  onSelectPackage: (packageId: string) => void;
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "Nessuna scadenza";
  const date = parseISO(expiresAt);
  if (isToday(date)) return "Scade oggi";
  return `Scadenza: ${format(date, "d MMM yyyy", { locale: it })}`;
}

export function PaymentCoverageSection({
  packages,
  isLoading,
  selectedPackageId,
  onSelectPackage,
}: PaymentCoverageSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  // State 0: No valid packages → Single lesson (read-only)
  if (packages.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-[15px] leading-6 font-medium">Pagamento</h3>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-[15px] leading-6 font-medium">Lezione singola</p>
          <p className="text-xs text-muted-foreground mt-1">
            Il pagamento sarà dovuto dopo l'appuntamento o in caso di cancellazione tardiva.
          </p>
        </div>
      </div>
    );
  }

  // State 1: One valid package → Read-only, no single option
  if (packages.length === 1) {
    const pkg = packages[0];
    return (
      <div className="space-y-2">
        <h3 className="text-[15px] leading-6 font-medium">Copertura</h3>
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-[15px] leading-6 font-medium">{pkg.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Disponibili: {pkg.available} · {formatExpiry(pkg.expiresAt)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Questo appuntamento userà 1 credito del pacchetto.
        </p>
      </div>
    );
  }

  // State 2+: Radio list with FEFO badge
  return (
    <div className="space-y-2">
      <h3 className="text-[15px] leading-6 font-medium">Seleziona pacchetto</h3>
      <div className="space-y-2">
        {packages.map((pkg) => (
          <button
            key={pkg.packageId}
            type="button"
            onClick={() => onSelectPackage(pkg.packageId)}
            className={cn(
              "w-full p-3 rounded-lg border text-left transition-colors",
              selectedPackageId === pkg.packageId
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-[15px] leading-6 font-medium">{pkg.name}</p>
              {pkg.isFefoDefault && (
                <Badge variant="outline" className="text-xs">
                  Consigliato
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Disponibili: {pkg.available} · {formatExpiry(pkg.expiresAt)}
            </p>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Questo appuntamento userà 1 credito del pacchetto selezionato.
      </p>
    </div>
  );
}
