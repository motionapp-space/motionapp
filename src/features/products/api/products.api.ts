import { supabase } from "@/integrations/supabase/client";
import type { Product, CreateProductInput, UpdateProductInput } from "../types";

/**
 * Get all products for the authenticated coach
 */
export async function getProducts(): Promise<Product[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("coach_id", session.session.user.id)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get active visible products for the authenticated coach
 */
export async function getActiveProducts(): Promise<Product[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("coach_id", session.session.user.id)
    .eq("is_active", true)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single product by ID
 */
export async function getProduct(productId: string): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get product by type (e.g., single_session)
 */
export async function getProductByType(type: Product['type']): Promise<Product | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("coach_id", session.session.user.id)
    .eq("type", type)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Get product by credits amount (e.g., 10 for a 10-session pack)
 */
export async function getProductByCredits(creditsAmount: number): Promise<Product | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("coach_id", session.session.user.id)
    .eq("credits_amount", creditsAmount)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new product
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("products")
    .insert({
      coach_id: session.session.user.id,
      name: input.name,
      description: input.description,
      type: input.type,
      credits_amount: input.credits_amount,
      price_cents: input.price_cents,
      duration_months: input.duration_months,
      is_active: input.is_active ?? true,
      is_visible: input.is_visible ?? true,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing product
 */
export async function updateProduct(productId: string, input: UpdateProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update(input)
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a product (or deactivate if has orders)
 */
export async function deleteProduct(productId: string): Promise<void> {
  // First check if product has any orders
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("product_id", productId)
    .limit(1);

  if (orders && orders.length > 0) {
    // Has orders, just deactivate
    await updateProduct(productId, { is_active: false, is_visible: false });
    return;
  }

  // No orders, safe to delete
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) throw error;
}

/**
 * Reorder products
 */
export async function reorderProducts(productIds: string[]): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Update each product's sort_order
  const updates = productIds.map((id, index) => 
    supabase
      .from("products")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("coach_id", session.session!.user.id)
  );

  await Promise.all(updates);
}
