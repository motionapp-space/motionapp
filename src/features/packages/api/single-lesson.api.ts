/**
 * Single Lesson Package API
 * Explicit creation of single-session technical packages
 * Called only with explicit coach confirmation - never automatically
 */

import { supabase } from "@/integrations/supabase/client";
import { getPackageSettings, createPackage } from "./packages.api";
import { createLedgerEntry } from "./ledger.api";
import type { Package } from "../types";
import { format } from "date-fns";
import { it } from "date-fns/locale";

/**
 * Create a single lesson package for an event
 * This function requires explicit coach confirmation - never called automatically
 */
export async function createSingleLessonPackage(
  eventId: string,
  clientId: string,
  eventStartAt: string
): Promise<Package> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const settings = await getPackageSettings();
  const eventDate = format(new Date(eventStartAt), "d MMMM yyyy", { locale: it });

  // 1. Create single lesson package
  // createPackage does NOT create ledger entries - verified
  const pkg = await createPackage({
    client_id: clientId,
    name: `Lezione singola - ${eventDate}`,
    total_sessions: 1,
    price_total_cents: settings.sessions_1_price,
    duration_months: settings.sessions_1_duration,
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
