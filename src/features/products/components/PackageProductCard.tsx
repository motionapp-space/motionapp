import { Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "../types";
import { formatCurrency } from "@/features/packages/utils/kpi";

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
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Info pacchetto */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium">{product.name}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{product.credits_amount} sessioni</span>
              <span>·</span>
              <span>{durationLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              <span className="font-medium">{formatCurrency(product.price_cents)}</span>
              <span className="text-muted-foreground">
                ({formatCurrency(pricePerSession)}/sessione
                {discountPercent > 0 && ` · -${discountPercent}%`})
              </span>
            </div>
          </div>

          {/* Singola azione */}
          <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4 mr-1" />
            Modifica
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
