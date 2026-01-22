import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceInput } from "@/components/ui/price-input";
import { useUpdateProduct } from "../hooks/useProducts";
import type { Product } from "../types";
import { Loader2 } from "lucide-react";

interface SingleSessionPriceCardProps {
  product: Product | undefined;
  isLoading?: boolean;
}

export function SingleSessionPriceCard({ product, isLoading }: SingleSessionPriceCardProps) {
  const [localPrice, setLocalPrice] = useState<number>(product?.price_cents ?? 5000);
  const updateProduct = useUpdateProduct();

  // Sync local price when product changes
  if (product && localPrice !== product.price_cents && !updateProduct.isPending) {
    setLocalPrice(product.price_cents);
  }

  const handlePriceChange = (cents: number) => {
    setLocalPrice(cents);
  };

  const handlePriceBlur = () => {
    if (product && localPrice !== product.price_cents) {
      updateProduct.mutate({
        productId: product.id,
        input: { price_cents: localPrice },
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💳</span> Lezione singola
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💳</span> Lezione singola
        </CardTitle>
        <CardDescription>
          Questo è il prezzo base utilizzato per calcolare gli sconti dei pacchetti
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-40">
            <PriceInput
              value={localPrice}
              onChange={handlePriceChange}
              onBlur={handlePriceBlur}
            />
          </div>
          {updateProduct.isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
