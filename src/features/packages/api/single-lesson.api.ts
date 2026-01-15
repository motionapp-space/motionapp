/**
 * Single Lesson Package API
 * Explicit creation of single-session technical packages
 * Called only with explicit coach confirmation - never automatically
 * 
 * @deprecated This creates technical packages. New flow should use orders directly.
 */

import { supabase } from "@/integrations/supabase/client";
import { createPackage } from "./packages.api";
import { createLedgerEntry } from "./ledger.api";
import { getProductByType } from "@/features/products/api/products.api";
import type { Package } from "../types";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { getCoachClientId } from "@/lib/coach-client";

/**
 * Create a single lesson package for an event
 * This function requires explicit coach confirmation - never called automatically
 * 
 * @deprecated Use createSingleLessonOrder instead for new implementations
 */
export async function createSingleLessonPackage(
  eventId: string,
  clientId: string,
  eventStartAt: string
): Promise<Package> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Get single session product from catalog
  const singleProduct = await getProductByType('single_session');
  const eventDate = format(new Date(eventStartAt), "d MMMM yyyy", { locale: it });

  // Get the coach_client_id for this client
  const coachClientId = await getCoachClientId(clientId);

  // 1. Create single lesson package
  // createPackage does NOT create ledger entries - verified
  const pkg = await createPackage({
    coach_client_id: coachClientId,
    name: `Lezione singola - ${eventDate}`,
    total_sessions: 1,
    price_total_cents: singleProduct?.price_cents ?? 5000,
    duration_months: singleProduct?.duration_months ?? 1,
    payment_status: 'unpaid',
    is_single_technical: true,
  });

  // 2. Create HOLD in ledger
  // createLedgerEntry is idempotent - verified
  await createLedgerEntry(
    pkg.package_id,
    'HOLD_CREATE',
    'CONFIRM',
    0,  // delta_consumed
    1,  // delta_hold
    eventId,
    `Lezione singola - ${eventDate}`
  );

  // 3. Update on_hold counter (newly created package = 0 → 1)
  const { data: updatedPkg, error } = await supabase
    .from("package")
    .update({ on_hold_sessions: 1 })
    .eq("package_id", pkg.package_id)
    .select()
    .single();

  if (error) throw error;
  return updatedPkg as Package;
}

/**
 * Create a single lesson order directly linked to an event
 * This is the NEW flow - no technical package created
 */
export async function createSingleLessonOrder(
  eventId: string,
  coachClientId: string,
  eventStartAt: string
): Promise<{ orderId: string }> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Get single session product from catalog
  const singleProduct = await getProductByType('single_session');
  
  if (!singleProduct) {
    throw new Error("Prodotto 'Lezione singola' non trovato nel catalogo");
  }

  // Create order directly linked to event
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      coach_client_id: coachClientId,
      event_id: eventId,
      product_id: singleProduct.id,
      kind: 'single_session',
      amount_cents: singleProduct.price_cents,
      currency_code: 'EUR',
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;
  return { orderId: order.id };
}
