import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Package, PackagePaymentStatus } from "../types";
import { 
  calculatePackageKPI, 
  formatCurrency, 
  getUsageStatusInfo, 
  getPaymentStatusInfo 
} from "../utils/kpi";
import { PackageStatsBar } from "./PackageStatsBar";
import { PaymentStatusDialog } from "./PaymentStatusDialog";
import { MoreVertical, Pause, Play, Archive, Eye, AlertCircle, Info, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface PackageCardProps {
  package: Package;
  onViewDetails: () => void;
  onToggleSuspension: () => void;
  onArchive: () => void;
  onUpdatePaymentStatus: (newStatus: PackagePaymentStatus, partialPaymentCents?: number, note?: string) => void;
}

export function PackageCard({
  package: pkg,
  onViewDetails,
  onToggleSuspension,
  onArchive,
  onUpdatePaymentStatus,
}: PackageCardProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  
  const kpi = calculatePackageKPI(pkg);
  const usageInfo = getUsageStatusInfo(pkg.usage_status as any);
  const paymentInfo = getPaymentStatusInfo(pkg.payment_status as any);
  const progressPercent = (pkg.consumed_sessions / pkg.total_sessions) * 100;
  const canArchive = pkg.on_hold_sessions === 0;

  const createdDate = format(new Date(pkg.created_at), "d MMM yyyy", { locale: it });
  const expiresDate = pkg.expires_at ? format(new Date(pkg.expires_at), "d MMM yyyy", { locale: it }) : null;

  return (
    <Card className="p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold">{pkg.name}</h3>
          <p className="text-xs text-muted-foreground">
            Creato il {createdDate}
            {expiresDate && ` • Scade il ${expiresDate}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline"
                  className={cn("cursor-help", 
                    pkg.usage_status === 'active' ? "border-success/50 bg-success/10 text-foreground dark:text-success" :
                    pkg.usage_status === 'suspended' ? "border-destructive/50 bg-destructive/10 text-foreground dark:text-destructive" :
                    pkg.usage_status === 'completed' ? "border-warning/50 bg-warning/10 text-foreground dark:text-warning" :
                    "border-muted-foreground/50 bg-muted-foreground/10 text-foreground dark:text-muted-foreground"
                  )}
                >
                  {usageInfo.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Stato di utilizzo del pacchetto</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline"
                  className={cn("cursor-help",
                    pkg.payment_status === 'paid' ? "border-success/50 bg-success/10 text-foreground dark:text-success" :
                    pkg.payment_status === 'unpaid' ? "border-destructive/50 bg-destructive/10 text-foreground dark:text-destructive" :
                    pkg.payment_status === 'partial' ? "border-warning/50 bg-warning/10 text-foreground dark:text-warning" :
                    "border-muted-foreground/50 bg-muted-foreground/10 text-foreground dark:text-muted-foreground"
                  )}
                >
                  {paymentInfo.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Stato di pagamento</p>
                  {pkg.payment_status === 'partial' && pkg.price_total_cents && (
                    <>
                      <p>Pagato: {formatCurrency(pkg.partial_payment_cents)}</p>
                      <p>Rimanente: {formatCurrency(pkg.price_total_cents - pkg.partial_payment_cents)}</p>
                    </>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>

          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 bg-background">
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="h-4 w-4" />
                Dettagli completi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaymentDialogOpen(true)}>
                <CreditCard className="h-4 w-4" />
                Modifica stato pagamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleSuspension}>
                {pkg.usage_status === 'suspended' ? (
                  <>
                    <Play className="h-4 w-4" />
                    Riattiva pacchetto
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Sospendi pacchetto
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onArchive} 
                disabled={!canArchive}
              >
                <Archive className="h-4 w-4" />
                Archivia
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Bar */}
      <PackageStatsBar
        stats={[
          { label: "Totali", value: kpi.total },
          { label: "Completate", value: kpi.consumed },
          { 
            label: "Prenotate", 
            value: kpi.on_hold,
            highlight: kpi.on_hold > 0 ? 'info' : undefined
          },
          { 
            label: "Disponibili", 
            value: kpi.available,
            highlight: kpi.available > 0 ? 'success' : undefined
          },
        ]}
      />

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">{pkg.consumed_sessions}/{pkg.total_sessions} completate</span>
        </div>
        <Progress 
          value={progressPercent} 
          className="h-2 rounded-full bg-muted" 
        />
      </div>

      {/* Price Info */}
      {pkg.price_total_cents !== null && (
        <div className="grid grid-cols-2 gap-y-2 pt-4 border-t text-sm">
          <div className="text-muted-foreground">Prezzo totale</div>
          <div className="text-right font-semibold">{formatCurrency(pkg.price_total_cents)}</div>
          
          {kpi.price_per_session !== null && (
            <>
              <div className="text-muted-foreground">Prezzo unitario</div>
              <div className="text-right font-semibold flex items-center justify-end gap-2">
                {formatCurrency(kpi.price_per_session)}
                {pkg.price_source === 'custom' && (
                  <Badge variant="secondary" className="text-xs">Personalizzato</Badge>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Alerts */}
      {pkg.usage_status === 'active' && kpi.on_hold > 0 && (
        <Alert className="bg-info/10 border-info">
          <Info className="h-4 w-4 text-info" />
          <AlertDescription className="text-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help underline decoration-dotted">
                    {kpi.on_hold} {kpi.on_hold === 1 ? 'sessione in attesa' : 'sessioni in attesa'}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Prenotazioni confermate ma non ancora svolte. Il credito è riservato fino al completamento.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </AlertDescription>
        </Alert>
      )}

      {pkg.usage_status === 'suspended' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Pacchetto sospeso: non è possibile confermare nuove prenotazioni.
          </AlertDescription>
        </Alert>
      )}


      <PaymentStatusDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        currentStatus={pkg.payment_status as PackagePaymentStatus}
        currentPartialPayment={pkg.partial_payment_cents}
        totalPrice={pkg.price_total_cents}
        onSave={onUpdatePaymentStatus}
      />
    </Card>
  );
}
