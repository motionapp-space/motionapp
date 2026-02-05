import { useState, useRef, useEffect } from "react";
import { Plus, Loader2, Package, CreditCard, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { PanelHeader } from "@/components/ui/panel-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  const queryClient = useQueryClient();
  const { data: products, isLoading, refetch } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeoutRef = useRef<number | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  // Separate single session from packages
  const singleSession = products?.find(p => p.type === "single_session");
  const packages = products?.filter(p => p.type === "session_pack") || [];
  const singleSessionPrice = singleSession?.price_cents || 5000;

  // Sort packages by credits_amount ascending
  const sortedPackages = [...packages].sort((a, b) => a.credits_amount - b.credits_amount);

  // Single session price state
  const [localPrice, setLocalPrice] = useState<number>(singleSessionPrice);

  // Sync local price ONLY when DB value actually changes (not on every render)
  useEffect(() => {
    if (singleSession && !updateProduct.isPending) {
      setLocalPrice(singleSession.price_cents);
    }
  }, [singleSession?.price_cents]);

  const handlePriceChange = (cents: number) => {
    setLocalPrice(cents);
  };

  const showSavedFeedback = () => {
    setShowSaved(true);
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = window.setTimeout(() => {
      setShowSaved(false);
    }, 3500);
  };

  const handlePriceBlur = async () => {
    // Skip se il prezzo non è cambiato e il prodotto esiste
    if (singleSession && localPrice === singleSession.price_cents) {
      return;
    }

    try {
      if (singleSession) {
        // Caso 1: Prodotto esiste → UPDATE
        await updateProduct.mutateAsync({
          productId: singleSession.id,
          input: { price_cents: localPrice },
        });
        showSavedFeedback();
      } else {
        // Caso 2: Prodotto NON esiste → CREATE
        try {
          await createProduct.mutateAsync({
            name: "Lezione singola",
            type: "single_session",
            credits_amount: 1,
            price_cents: localPrice,
            duration_months: 12,
            is_active: true,
            is_visible: true,
            sort_order: 0,
          });
          showSavedFeedback();
        } catch (createError: unknown) {
          // Caso 3: Conflict (duplicate key) → Refetch + UPDATE
          const errorMessage = createError instanceof Error 
            ? createError.message 
            : String(createError);
            
          if (errorMessage.includes("duplicate") || errorMessage.includes("unique") || errorMessage.includes("23505")) {
            // Race condition: prodotto creato da altro processo
            await queryClient.invalidateQueries({ queryKey: ["products"] });
            
            const refreshedProducts = await refetch();
            const refreshedSingle = refreshedProducts.data?.find(
              p => p.type === "single_session"
            );
            
            if (refreshedSingle) {
              await updateProduct.mutateAsync({
                productId: refreshedSingle.id,
                input: { price_cents: localPrice },
              });
              showSavedFeedback();
            }
          } else {
            throw createError;
          }
        }
      }
    } catch {
      // Errore già gestito dal hook (toast)
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
      <div className="space-y-6">
        <PanelHeader 
          title="Lezioni e pacchetti" 
          subtitle="Configura i valori di default per lezioni singole e pacchetti"
        />
        <Card>
          <CardContent className="pt-6 space-y-6">
          {/* SEZIONE 1: Lezione singola */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                <h3 className="text-base font-semibold leading-6 text-foreground">Lezione singola</h3>
              </div>
              <p className="text-[13px] leading-5 text-muted-foreground pl-7">
                Imposta il prezzo di default di una lezione singola.
              </p>
            </div>
            <div className="space-y-2 pl-7">
              <div className="flex items-center gap-2">
                <div className="flex-1 max-w-sm">
                  <PriceInput
                    value={localPrice}
                    onChange={handlePriceChange}
                    onBlur={handlePriceBlur}
                  />
                </div>
                {/* Stato salvataggio */}
                {(updateProduct.isPending || createProduct.isPending) && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvataggio…
                  </span>
                )}
                {showSaved && !updateProduct.isPending && !createProduct.isPending && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                    <Check className="h-4 w-4" />
                    Salvato
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Influisce sullo sconto mostrato nei pacchetti · Salvataggio automatico
              </p>
            </div>
          </div>

          <Separator />

          {/* SEZIONE 2: Pacchetti */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                  <h3 className="text-base font-semibold leading-6 text-foreground">Pacchetti</h3>
                </div>
                <p className="text-[13px] leading-5 text-muted-foreground pl-7">
                  Definisci i pacchetti predefiniti che potrai assegnare ai clienti.
                </p>
              </div>
              <Button onClick={handleCreateProduct} size="sm">
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
                    singleSessionPrice={localPrice}
                    isBasePriceUpdating={updateProduct.isPending}
                    onEdit={handleEditProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

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
