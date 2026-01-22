import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Plus, Loader2, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SingleSessionPriceCard } from "./SingleSessionPriceCard";
import { PackageProductCard } from "./PackageProductCard";
import { ProductFormDialog } from "./ProductFormDialog";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useReorderProducts,
} from "../hooks/useProducts";
import type { Product, CreateProductInput, UpdateProductInput } from "../types";

export function ProductCatalogSettings() {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const reorderProducts = useReorderProducts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Separate single session from packages
  const singleSession = products?.find(p => p.type === "single_session");
  const packages = products?.filter(p => p.type === "session_pack") || [];
  const singleSessionPrice = singleSession?.price_cents || 5000;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = packages.findIndex(p => p.id === active.id);
      const newIndex = packages.findIndex(p => p.id === over.id);
      const newOrder = arrayMove(packages, oldIndex, newIndex);
      reorderProducts.mutate(newOrder.map(p => p.id));
    }
  }, [packages, reorderProducts]);

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDuplicateProduct = (product: Product) => {
    const duplicateData: CreateProductInput = {
      name: `${product.name} (copia)`,
      type: "session_pack",
      credits_amount: product.credits_amount,
      price_cents: product.price_cents,
      duration_months: product.duration_months,
      description: product.description,
      is_active: true,
      is_visible: product.is_visible,
      sort_order: (packages.length + 1) * 10,
    };
    createProduct.mutate(duplicateData);
  };

  const handleToggleVisibility = (product: Product) => {
    updateProduct.mutate({
      productId: product.id,
      input: { is_visible: !product.is_visible },
    });
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct.mutate(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleFormSubmit = (data: CreateProductInput | UpdateProductInput) => {
    if (editingProduct) {
      updateProduct.mutate(
        { productId: editingProduct.id, input: data },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createProduct.mutate(data as CreateProductInput, {
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
    <div className="space-y-8">
      {/* Single Session Price */}
      <SingleSessionPriceCard product={singleSession} isLoading={isLoading} />

      {/* Packages Catalog */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                I tuoi pacchetti
              </CardTitle>
              <CardDescription>
                Trascina per riordinare. I pacchetti in cima appariranno per primi.
              </CardDescription>
            </div>
            <Button onClick={handleCreateProduct} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuovo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nessun pacchetto creato</p>
              <p className="text-sm">Crea il tuo primo pacchetto sessioni</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={packages.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {packages.map(product => (
                    <PackageProductCard
                      key={product.id}
                      product={product}
                      singleSessionPrice={singleSessionPrice}
                      onEdit={handleEditProduct}
                      onDuplicate={handleDuplicateProduct}
                      onToggleVisibility={handleToggleVisibility}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il pacchetto?</AlertDialogTitle>
            <AlertDialogDescription>
              {productToDelete?.name} verrà eliminato. Se ci sono ordini associati, 
              il pacchetto verrà disattivato invece che eliminato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
