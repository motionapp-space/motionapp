import type { PaymentKPIs } from "../hooks/usePaymentKPIs";

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
}

export function PaymentKPICards({
  kpis,
  monthLabel,
  onFilterOutstanding,
  isOutstandingActive,
}: Props) {
  const { daIncassareTotale, parteCerta, parteNonCerta, incassatoMese } = kpis;
  const certaPct =
    daIncassareTotale > 0 ? (parteCerta / daIncassareTotale) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {/* Card 1 — Da incassare (operativa) */}
      <div
        className={`col-span-1 sm:col-span-2 rounded-2xl border bg-card p-6 cursor-pointer transition-colors duration-150 hover:bg-muted/20 hover:border-foreground/20 ${
          isOutstandingActive ? "border-foreground/40" : ""
        }`}
        onClick={onFilterOutstanding}
      >
        <p className="text-sm text-muted-foreground">Da incassare</p>
        <p className="text-3xl font-semibold text-foreground mt-1">
          {formatEur(daIncassareTotale)}
        </p>

        {daIncassareTotale > 0 && (
          <>
            <div className="mt-3 space-y-2">
              {parteCerta > 0 && (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  {formatEur(parteCerta)} già dovuti
                </div>
              )}
              {parteNonCerta > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                  {formatEur(parteNonCerta)} non ancora dovuti
                </div>
              )}
            </div>

            {/* Stacked bar */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden flex">
              {certaPct > 0 && (
                <div
                  className="h-full bg-emerald-500 rounded-l-full"
                  style={{ width: `${certaPct}%` }}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Card 2 — Incassato nel mese (informativa, non cliccabile) */}
      <div className="col-span-1 rounded-2xl border border-border/70 bg-card p-6 select-none">
        <p className="text-sm text-muted-foreground">Incassato nel mese</p>
        <p className="text-3xl font-semibold text-emerald-700 mt-1">
          {formatEur(incassatoMese)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Incassi registrati nel mese (parziali inclusi)
        </p>
      </div>
    </div>
  );
}
