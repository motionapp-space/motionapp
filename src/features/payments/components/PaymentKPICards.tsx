import type { PaymentKPIs } from "../hooks/usePaymentKPIs";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

function formatEur(cents: number) {
  return (cents / 100).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

interface Props {
  kpis: PaymentKPIs;
  monthLabel: string;
  onFilterOutstanding?: () => void;
  isOutstandingActive?: boolean;
  monthSelector?: React.ReactNode;
}

export function PaymentKPICards({
  kpis,
  monthLabel,
  onFilterOutstanding,
  isOutstandingActive,
  monthSelector,
}: Props) {
  const { daIncassareTotale, parteCerta, parteNonCerta, incassatoMese } = kpis;
  const certaPct =
    daIncassareTotale > 0 ? (parteCerta / daIncassareTotale) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {/* Card 1 — Da incassare (operativa) */}
      <div
        className={`col-span-1 sm:col-span-2 rounded-2xl border border-border bg-card p-6 cursor-pointer transition-colors duration-150 hover:bg-muted/20 hover:border-foreground/20 ${
          isOutstandingActive ? "border-foreground/40" : ""
        }`}
        onClick={onFilterOutstanding}
      >
        <p className="text-sm font-medium text-muted-foreground">Da incassare</p>
        <p className="text-4xl font-semibold tracking-tight tabular-nums text-foreground mt-2">
          {formatEur(daIncassareTotale)}
        </p>

        {daIncassareTotale > 0 && (
          <>
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-muted-foreground">Di cui:</p>
              {parteCerta > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Già dovuti</span>
                  <span className="tabular-nums font-medium text-foreground">{formatEur(parteCerta)}</span>
                </div>
              )}
              {parteNonCerta > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Non ancora dovuti</span>
                  <span className="tabular-nums text-muted-foreground">{formatEur(parteNonCerta)}</span>
                </div>
              )}
            </div>

            {/* Stacked bar */}
            <div className="mt-4 h-2 w-full rounded-full bg-muted overflow-hidden">
              {certaPct > 0 && (
                <div
                  className="h-full bg-success rounded-full"
                  style={{ width: `${certaPct}%` }}
                />
              )}
            </div>

            <div className="mt-4">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 transition-colors"
                    >
                      Come viene calcolato?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="max-w-xs text-xs leading-relaxed">
                    <p>
                      <span className="font-medium text-foreground">Già dovuti</span>: pacchetti venduti e lezioni già svolte.
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-foreground">Non ancora dovuti</span>: lezioni future non ancora svolte.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </>
        )}
      </div>

      {/* Card 2 — Incassato nel mese (con MonthSelector) */}
      <div className="col-span-1 rounded-2xl border border-border bg-card p-6 select-none">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-muted-foreground">Incassato nel mese</p>
          {monthSelector}
        </div>
        <p className="text-4xl font-semibold tracking-tight tabular-nums text-foreground mt-3">
          {formatEur(incassatoMese)}
        </p>
        <p className="text-sm text-success mt-2">
          Incassi registrati nel mese (parziali inclusi)
        </p>
      </div>
    </div>
  );
}
