/**
 * Calendar-Package Integration API
 * Manages automatic credit consumption based on calendar event status changes
 */

import { supabase } from "@/integrations/supabase/client";
import { getActivePackageByCoachClient } from "./packages.api";
import { getCoachSettings } from "@/features/products/api/coach-settings.api";
import { createLedgerEntry } from "./ledger.api";
import type { Package } from "../types";

/**
 * Handle event confirmation - creates hold on package
 * Returns null if no active package exists
 */
export async function handleEventConfirm(
  eventId: string,
  coachClientId: string,
  startAt: string
): Promise<{ package: Package; holdCreated: boolean } | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Get active package - DO NOT auto-create
  const pkg = await getActivePackageByCoachClient(coachClientId);
  
  if (!pkg) {
    return null;
  }

  // Check if package is expired
  if (pkg.expires_at && new Date(pkg.expires_at) <= new Date()) {
    throw new Error(
      "Il pacchetto è scaduto. Impossibile creare una prenotazione."
    );
  }

  // Check if package is suspended
  if (pkg.usage_status === 'suspended') {
    throw new Error(
      "Il pacchetto è sospeso. Impossibile creare una prenotazione."
    );
  }

  // Check available credits (total - consumed - on_hold)
  const available = pkg.total_sessions - pkg.consumed_sessions - pkg.on_hold_sessions;
  if (available < 1) {
    throw new Error(
      `Credito insufficiente. Disponibili: ${available}, ` +
      `in attesa: ${pkg.on_hold_sessions}, consumate: ${pkg.consumed_sessions}`
    );
  }

  // Create hold (idempotent via unique constraint)
  await createLedgerEntry(
    pkg.package_id,
    'HOLD_CREATE',
    'CONFIRM',
    0,
    1,
    eventId,
    `Appuntamento confermato - ${new Date(startAt).toLocaleDateString('it-IT')}`
  );

  // Update package counters
  const { data: updatedPkg, error } = await supabase
    .from("package")
    .update({ on_hold_sessions: pkg.on_hold_sessions + 1 })
    .eq("package_id", pkg.package_id)
    .select()
    .single();

  if (error) throw error;

  return { package: updatedPkg, holdCreated: true };
}

/**
 * Handle event completion - releases hold and consumes credit
 */
export async function handleEventComplete(
  eventId: string,
  packageId: string
): Promise<Package> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Get package via view to verify coach access
  const { data: pkg, error: pkgError } = await supabase
    .from("package")
    .select("*, coach_clients!inner(coach_id)")
    .eq("package_id", packageId)
    .single();

  if (pkgError) throw pkgError;

  // Create ledger entry (releases hold, consumes credit)
  await createLedgerEntry(
    packageId,
    'CONSUME',
    'COMPLETE',
    1,
    -1,
    eventId,
    "Sessione completata"
  );

  // Update package counters
  const newConsumed = pkg.consumed_sessions + 1;
  const newOnHold = Math.max(0, pkg.on_hold_sessions - 1);

  const { data: updatedPkg, error } = await supabase
    .from("package")
    .update({ 
      consumed_sessions: newConsumed,
      on_hold_sessions: newOnHold,
    })
    .eq("package_id", packageId)
    .select()
    .single();

  if (error) throw error;
  return updatedPkg;
}

/**
 * Handle event cancellation
 * - If >24h before start: release hold (CANCEL_GT_24H)
 * - If <24h before start: consume credit (CANCEL_LT_24H)
 * - If forceFree: always release hold (professional cancellation)
 */
export async function handleEventCancel(
  eventId: string,
  packageId: string,
  startAt: string,
  options?: { forceFree?: boolean }
): Promise<{ package: Package; penaltyApplied: boolean }> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const coachSettings = await getCoachSettings();
  const hoursUntilStart = (new Date(startAt).getTime() - Date.now()) / (1000 * 60 * 60);

  // Determine if within cancel policy window (skip if forceFree)
  const isLateCancellation = !options?.forceFree && hoursUntilStart < coachSettings.lock_window_hours;

  // Get package via view to verify coach access
  const { data: pkg, error: pkgError } = await supabase
    .from("package")
    .select("*, coach_clients!inner(coach_id)")
    .eq("package_id", packageId)
    .single();

  if (pkgError) throw pkgError;

  if (isLateCancellation) {
    // Late cancel: consume credit
    await createLedgerEntry(
      packageId,
      'CONSUME',
      'CANCEL_LT_24H',
      1,
      -1,
      eventId,
      `Cancellazione tardiva (meno di ${coachSettings.lock_window_hours}h prima)`
    );

    const { data: updatedPkg, error } = await supabase
      .from("package")
      .update({ 
        consumed_sessions: pkg.consumed_sessions + 1,
        on_hold_sessions: Math.max(0, pkg.on_hold_sessions - 1),
      })
      .eq("package_id", packageId)
      .select()
      .single();

    if (error) throw error;
    return { package: updatedPkg, penaltyApplied: true };
  } else {
    // Early cancel: just release hold
    await createLedgerEntry(
      packageId,
      'HOLD_RELEASE',
      'CANCEL_GT_24H',
      0,
      -1,
      eventId,
      "Cancellazione anticipata - credito rilasciato"
    );

    const { data: updatedPkg, error } = await supabase
      .from("package")
      .update({ 
        on_hold_sessions: Math.max(0, pkg.on_hold_sessions - 1),
      })
      .eq("package_id", packageId)
      .select()
      .single();

    if (error) throw error;
    return { package: updatedPkg, penaltyApplied: false };
  }
}

/**
 * Find package ID for an event (looks up in ledger)
 */
export async function findPackageForEvent(eventId: string): Promise<string | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("package_ledger")
    .select("package_id")
    .eq("calendar_event_id", eventId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.package_id || null;
}

/**
 * Check if event is within lock window (for penalty logic)
 */
export function isWithinLockWindow(startAt: string, lockWindowHours: number): boolean {
  const hoursUntilStart = (new Date(startAt).getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntilStart < lockWindowHours;
}
