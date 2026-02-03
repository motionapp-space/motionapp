import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getProducts, 
  getActiveProducts, 
  getProductByCredits,
  createProduct, 
  updateProduct, 
  deleteProduct,
  reorderProducts,
} from "../api/products.api";
import type { CreateProductInput, UpdateProductInput } from "../types";
import { toast } from "sonner";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });
}

export function useActiveProducts() {
  return useQuery({
    queryKey: ["products", "active"],
    queryFn: getActiveProducts,
  });
}

export function useProductByCredits(credits: number) {
  return useQuery({
    queryKey: ["products", "credits", credits],
    queryFn: () => getProductByCredits(credits),
    enabled: credits > 0,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile creare il prodotto",
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: UpdateProductInput }) => 
      updateProduct(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile aggiornare il prodotto",
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Prodotto eliminato");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile eliminare il prodotto",
      });
    },
  });
}

export function useReorderProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productIds: string[]) => reorderProducts(productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile riordinare i prodotti",
      });
    },
  });
}
