import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Package } from "../types";
import { 
  calculatePackageKPI, 
  formatCurrency, 
  getUsageStatusInfo, 
  getPaymentStatusInfo 
} from "../utils/kpi";
import { MoreVertical, Pause, Play, Archive, Copy, Eye } from "lucide-react";

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

  return (
    <Card className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <h3 className="text-lg font-semibold">{pkg.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={usageInfo.color}>
              {usageInfo.icon} {usageInfo.label}
            </Badge>
            <Badge variant="outline" className={paymentInfo.color}>
              {paymentInfo.icon} {paymentInfo.label}
            </Badge>
            {pkg.is_single_technical && (
              <Badge variant="secondary">Tecnico</Badge>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewDetails}>
              <Eye className="h-4 w-4 mr-2" />
              Dettagli
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleSuspension}>
              {pkg.usage_status === 'suspended' ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Riattiva
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Sospendi
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
              Duplica
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t">
        <div>
          <p className="text-sm text-muted-foreground">Rimanenti</p>
          <p className="text-2xl font-bold">{kpi.remaining}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">In attesa</p>
          <p className="text-2xl font-bold text-warning">{kpi.on_hold}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Completate</p>
          <p className="text-2xl font-bold">{kpi.consumed}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Disponibili</p>
          <p className="text-2xl font-bold text-success">{kpi.available}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercent} className="h-2" />
        <p className="text-sm text-muted-foreground text-center">
          {pkg.consumed_sessions}/{pkg.total_sessions} completate
        </p>
      </div>

      {/* Price Info */}
      {pkg.price_total_cents !== null && (
        <div className="pt-4 border-t space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Prezzo totale</span>
            <span className="font-semibold">{formatCurrency(pkg.price_total_cents)}</span>
          </div>
          {kpi.price_per_session !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Prezzo unitario</span>
              <span className="text-sm">{formatCurrency(kpi.price_per_session)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {pkg.price_source === 'custom' ? 'Personalizzato' : 'Listino'}
            </span>
          </div>
        </div>
      )}

      {/* Helper Text */}
      {pkg.usage_status === 'active' && (
        <p className="text-xs text-muted-foreground pt-2 border-t">
          Le prenotazioni confermate riservano il credito finché non si svolgono (in attesa).
        </p>
      )}

      {pkg.usage_status === 'suspended' && (
        <p className="text-xs text-destructive pt-2 border-t">
          Pacchetto sospeso: non è possibile confermare nuove prenotazioni.
        </p>
      )}

      {pkg.payment_status === 'unpaid' && (
        <p className="text-xs text-warning pt-2 border-t">
          Questo pacchetto risulta ancora da pagare.
        </p>
      )}
    </Card>
  );
}
