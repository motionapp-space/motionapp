import { useState } from "react";
import { Plus, Loader2, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceInput } from "@/components/ui/price-input";
import { PackageProductCard } from "./PackageProductCard";
import { ProductFormDialog } from "./ProductFormDialog";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
} from "../hooks/useProducts";
import type { Product, CreateProductInput, UpdateProductInput } from "../types";

export function ProductCatalogSettings() {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Separate single session from packages
  const singleSession = products?.find(p => p.type === "single_session");
  const packages = products?.filter(p => p.type === "session_pack") || [];
  const singleSessionPrice = singleSession?.price_cents || 5000;

  // Sort packages by credits_amount ascending
  const sortedPackages = [...packages].sort((a, b) => a.credits_amount - b.credits_amount);

  // Single session price state
  const [localPrice, setLocalPrice] = useState<number>(singleSessionPrice);

  // Sync local price when product changes
  if (singleSession && localPrice !== singleSession.price_cents && !updateProduct.isPending) {
    setLocalPrice(singleSession.price_cents);
  }

  const handlePriceChange = (cents: number) => {
    setLocalPrice(cents);
  };

  const handlePriceBlur = () => {
    if (singleSession && localPrice !== singleSession.price_cents) {
      updateProduct.mutate({
        productId: singleSession.id,
        input: { price_cents: localPrice },
      });
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleFormSubmit = (data: CreateProductInput | UpdateProductInput) => {
    // Force is_active and is_visible to true for all packages
    const payload = {
      ...data,
      is_active: true,
      is_visible: true,
    };

    if (editingProduct) {
      updateProduct.mutate(
        { productId: editingProduct.id, input: payload },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createProduct.mutate(payload as CreateProductInput, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lezioni e pacchetti</CardTitle>
          <CardDescription>
            Definisci i valori di default per lezioni singole e pacchetti
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* SEZIONE 1: Lezione singola */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-lg font-semibold">Lezione singola</h4>
              <p className="text-sm text-muted-foreground">
                Imposta il prezzo di default di una lezione singola. 
                Questo valore verrà proposto automaticamente in fase di creazione 
                e usato come base per il calcolo dello sconto nei pacchetti.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
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
          </div>

          {/* SEZIONE 2: Pacchetti */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-lg font-semibold">Pacchetti di lezioni</h4>
                <p className="text-sm text-muted-foreground">
                  Definisci i pacchetti predefiniti che potrai assegnare ai clienti.
                </p>
              </div>
              <Button onClick={handleCreateProduct} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Nuovo pacchetto
              </Button>
            </div>

            {sortedPackages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nessun pacchetto creato</p>
                <p className="text-sm">Crea il tuo primo pacchetto di sessioni</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedPackages.map(product => (
                  <PackageProductCard
                    key={product.id}
                    product={product}
                    singleSessionPrice={singleSessionPrice}
                    onEdit={handleEditProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        singleSessionPrice={singleSessionPrice}
        onSubmit={handleFormSubmit}
        isLoading={createProduct.isPending || updateProduct.isPending}
      />
    </>
  );
}
