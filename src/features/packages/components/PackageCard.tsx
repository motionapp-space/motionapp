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
import { Package } from "../types";
import { 
  calculatePackageKPI, 
  formatCurrency, 
  getUsageStatusInfo, 
  getPaymentStatusInfo 
} from "../utils/kpi";
import { PackageStatsBar } from "./PackageStatsBar";
import { MoreVertical, Pause, Play, Archive, Copy, Eye, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface PackageCardProps {
  package: Package;
  onViewDetails: () => void;
  onToggleSuspension: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
}

export function PackageCard({
  package: pkg,
  onViewDetails,
  onToggleSuspension,
  onArchive,
  onDuplicate,
}: PackageCardProps) {
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
                  variant={pkg.usage_status === 'active' ? 'default' : 'secondary'}
                  className="cursor-help"
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
                  variant={pkg.payment_status === 'paid' ? 'default' : 'outline'}
                  className="cursor-help"
                >
                  {paymentInfo.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Stato di pagamento del pacchetto</p>
              </TooltipContent>
            </Tooltip>

            {pkg.is_single_technical && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="cursor-help">Tecnico</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Pacchetto creato automaticamente</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 bg-background">
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                Dettagli completi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleSuspension}>
                {pkg.usage_status === 'suspended' ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Riattiva pacchetto
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Sospendi pacchetto
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onArchive} 
                disabled={!canArchive}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archivia
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplica pacchetto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Bar */}
      <PackageStatsBar
        stats={[
          { label: "Rimanenti", value: kpi.remaining },
          { 
            label: "In attesa", 
            value: kpi.on_hold,
            highlight: kpi.on_hold > 0 ? 'warning' : undefined
          },
          { label: "Completate", value: kpi.consumed },
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
          className="h-2 rounded-full" 
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

      {pkg.payment_status === 'unpaid' && (
        <Alert className="bg-warning/10 border-warning">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm text-warning-foreground">
            Questo pacchetto risulta ancora da pagare.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
