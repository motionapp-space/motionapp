import { supabase } from "@/integrations/supabase/client";
import { getActivePackage, createPackage, getPackage, getPackageSettings } from "./packages.api";
import { createLedgerEntry, isEventLocked } from "./ledger.api";
import type { Package } from "../types";

/**
 * Handle event confirmation: create hold on active package (or auto-create 1-session package)
 */
export async function handleEventConfirm(
  clientId: string, 
  eventId: string
): Promise<Package> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Start transaction-like operation using FOR UPDATE
  let pkg = await getActivePackage(clientId);

  // If no active package, auto-create a 1-session technical package
  if (!pkg) {
    const settings = await getPackageSettings();
    pkg = await createPackage({
      client_id: clientId,
      name: "1 lezione individuale",
      total_sessions: 1,
      price_total_cents: settings.sessions_1_price,
      payment_status: 'unpaid',
    });

    // Update the package record to mark it as technical
    await supabase
      .from("package")
      .update({ is_single_technical: true })
      .eq("package_id", pkg.package_id);

    pkg.is_single_technical = true;
  }

  // Check if package is suspended
  if (pkg.usage_status === 'suspended') {
    throw new Error("Impossibile confermare: il pacchetto è sospeso");
  }

  // Calculate available sessions
  const available = pkg.total_sessions - pkg.consumed_sessions - pkg.on_hold_sessions;
  
  if (available < 1) {
    throw new Error(
      `Credito insufficiente: disponibili ${available}, in attesa ${pkg.on_hold_sessions}. ` +
      "Crea un nuovo pacchetto o libera una prenotazione."
    );
  }

  // Create ledger entry (idempotent)
  const ledgerEntry = await createLedgerEntry(
    pkg.package_id,
    'HOLD_CREATE',
    'CONFIRM',
    0,
    1,
    eventId,
    "Prenotazione confermata"
  );

  // Only update package if ledger entry was created (not duplicate)
  if (ledgerEntry) {
    const { error } = await supabase
      .from("package")
      .update({
        on_hold_sessions: pkg.on_hold_sessions + 1,
      })
      .eq("package_id", pkg.package_id);

    if (error) throw error;
  }

  // Return updated package
  return getPackage(pkg.package_id);
}

/**
 * Handle event completion: release hold and consume session
 */
export async function handleEventComplete(
  eventId: string,
  eventStartAt: string
): Promise<Package> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Get the event to find its package
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("client_id")
    .eq("id", eventId)
    .single();

  if (eventError) throw eventError;

  const pkg = await getActivePackage(event.client_id);
  if (!pkg) throw new Error("Nessun pacchetto attivo trovato");

  // Check lock window
  const settings = await getPackageSettings();
  const locked = await isEventLocked(eventStartAt, settings.lock_window_hours);
  
  if (locked) {
    throw new Error(
      `Evento bloccato: sono passate più di ${settings.lock_window_hours} ore. ` +
      "Usa 'Correzione amministrativa' invece."
    );
  }

  // Create ledger entries (idempotent)
  await createLedgerEntry(
    pkg.package_id,
    'HOLD_RELEASE',
    'COMPLETE',
    0,
    -1,
    eventId,
    "Prenotazione completata - rilascio attesa"
  );

  await createLedgerEntry(
    pkg.package_id,
    'CONSUME',
    'COMPLETE',
    1,
    0,
    eventId,
    "Sessione consumata"
  );

  // Update package
  const { error } = await supabase
    .from("package")
    .update({
      on_hold_sessions: Math.max(0, pkg.on_hold_sessions - 1),
      consumed_sessions: pkg.consumed_sessions + 1,
    })
    .eq("package_id", pkg.package_id);

  if (error) throw error;

  return getPackage(pkg.package_id);
}

/**
 * Handle event cancellation
 */
export async function handleEventCancel(
  eventId: string,
  eventStartAt: string,
  isLateCancel: boolean
): Promise<Package> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Get the event to find its package
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("client_id")
    .eq("id", eventId)
    .single();

  if (eventError) throw eventError;

  const pkg = await getActivePackage(event.client_id);
  if (!pkg) throw new Error("Nessun pacchetto attivo trovato");

  // Check lock window
  const settings = await getPackageSettings();
  const locked = await isEventLocked(eventStartAt, settings.lock_window_hours);
  
  if (locked) {
    throw new Error(
      `Evento bloccato: sono passate più di ${settings.lock_window_hours} ore. ` +
      "Usa 'Correzione amministrativa' invece."
    );
  }

  const reason = isLateCancel ? 'CANCEL_LT_24H' : 'CANCEL_GT_24H';
  
  // Release hold
  await createLedgerEntry(
    pkg.package_id,
    'HOLD_RELEASE',
    reason,
    0,
    -1,
    eventId,
    isLateCancel ? "Cancellazione tardiva - rilascio attesa" : "Cancellazione - rilascio attesa"
  );

  let newConsumed = pkg.consumed_sessions;

  // If late cancel, also consume a session
  if (isLateCancel) {
    await createLedgerEntry(
      pkg.package_id,
      'CONSUME',
      reason,
      1,
      0,
      eventId,
      "Cancellazione tardiva - sessione consumata"
    );
    newConsumed += 1;
  }

  // Update package
  const { error } = await supabase
    .from("package")
    .update({
      on_hold_sessions: Math.max(0, pkg.on_hold_sessions - 1),
      consumed_sessions: newConsumed,
    })
    .eq("package_id", pkg.package_id);

  if (error) throw error;

  return getPackage(pkg.package_id);
}
