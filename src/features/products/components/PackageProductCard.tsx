
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "../types";
import { formatCurrency } from "@/features/packages/utils/kpi";
import { cn } from "@/lib/utils";

interface PackageProductCardProps {
  product: Product;
  singleSessionPrice: number;
  onEdit: (product: Product) => void;
}

export function PackageProductCard({
  product,
  singleSessionPrice,
  onEdit,
}: PackageProductCardProps) {
  const pricePerSession = product.price_cents / product.credits_amount;
  const expectedPrice = singleSessionPrice * product.credits_amount;
  const discountPercent = expectedPrice > 0 
    ? Math.round(((expectedPrice - product.price_cents) / expectedPrice) * 100) 
    : 0;

  const durationLabel = product.duration_months === 1 
    ? "1 mese" 
    : `${product.duration_months} mesi`;

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-4">
          {/* Info pacchetto */}
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold leading-snug">{product.name}</h4>
            <div className="mt-1 text-sm text-muted-foreground">
              {product.credits_amount} sessioni · {durationLabel}
            </div>
            <div className="mt-2">
              <div className="text-sm font-medium">{formatCurrency(product.price_cents)}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(pricePerSession)}/sessione
                </span>
                {discountPercent !== 0 && (
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full border",
                    discountPercent > 0
                      ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                      : "text-rose-600 bg-rose-50 border-rose-100"
                  )}>
                    {discountPercent > 0 ? `-${discountPercent}%` : `+${Math.abs(discountPercent)}%`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Singola azione */}
          <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
            Modifica
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
