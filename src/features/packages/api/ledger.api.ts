import { supabase } from "@/integrations/supabase/client";
import type { LedgerEntry, LedgerEntryWithEvent, CreateCorrectionInput, LedgerReason, LedgerType } from "../types";
import { getPackage } from "./packages.api";

/**
 * Get ledger entries for a package
 */
export async function getPackageLedger(packageId: string): Promise<LedgerEntryWithEvent[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("package_ledger")
    .select(`
      *,
      events(title, start_at)
    `)
    .eq("package_id", packageId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(entry => ({
    ...entry,
    event_title: entry.events?.title || null,
    event_start_at: entry.events?.start_at || null,
  }));
}

/**
 * Create a manual correction entry
 */
export async function createCorrection(
  packageId: string,
  input: CreateCorrectionInput
): Promise<LedgerEntry> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Validate the correction won't break invariants
  const pkg = await getPackage(packageId);
  
  const newConsumed = pkg.consumed_sessions + (input.delta_consumed || 0);
  const newOnHold = pkg.on_hold_sessions + (input.delta_hold || 0);
  
  if (newConsumed < 0) {
    throw new Error("Correzione non valida: le sessioni consumate non possono essere negative");
  }
  
  if (newOnHold < 0) {
    throw new Error("Correzione non valida: le sessioni in attesa non possono essere negative");
  }

  const available = pkg.total_sessions - newConsumed - newOnHold;
  if (available < 0) {
    throw new Error(
      `Correzione non valida: le sessioni disponibili diventerebbero negative (${available})`
    );
  }

  // Insert ledger entry
  const { data: ledgerData, error: ledgerError } = await supabase
    .from("package_ledger")
    .insert({
      package_id: packageId,
      type: 'CORRECTION',
      reason: 'ADMIN_CORRECTION',
      delta_consumed: input.delta_consumed || 0,
      delta_hold: input.delta_hold || 0,
      note: input.note,
      created_by: session.session.user.id,
    })
    .select()
    .single();

  if (ledgerError) throw ledgerError;

  // Update package totals
  const { error: updateError } = await supabase
    .from("package")
    .update({
      consumed_sessions: newConsumed,
      on_hold_sessions: newOnHold,
    })
    .eq("package_id", packageId);

  if (updateError) throw updateError;

  return ledgerData;
}

/**
 * Create a ledger entry (used internally by calendar integration)
 * This is idempotent: won't create duplicate entries for the same event+type
 */
export async function createLedgerEntry(
  packageId: string,
  type: LedgerType,
  reason: LedgerReason,
  deltaConsumed: number,
  deltaHold: number,
  eventId?: string,
  note?: string
): Promise<LedgerEntry | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Try to insert (will fail silently if duplicate due to unique constraint)
  const { data, error } = await supabase
    .from("package_ledger")
    .insert({
      package_id: packageId,
      calendar_event_id: eventId || null,
      type,
      reason,
      delta_consumed: deltaConsumed,
      delta_hold: deltaHold,
      note: note || null,
      created_by: session.session.user.id,
    })
    .select()
    .maybeSingle();

  // If it's a duplicate key error (code 23505), return null (idempotency)
  if (error && error.code === '23505') {
    console.log('Ledger entry already exists (idempotent):', { packageId, eventId, type });
    return null;
  }

  if (error) throw error;
  return data;
}

/**
 * Check if an event is within the lock window
 */
export async function isEventLocked(eventStartAt: string, lockWindowHours: number): Promise<boolean> {
  const eventDate = new Date(eventStartAt);
  const now = new Date();
  const lockThreshold = new Date(eventDate.getTime() + lockWindowHours * 60 * 60 * 1000);
  
  return now > lockThreshold;
}
