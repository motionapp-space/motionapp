/**
 * Email Snapshots Module
 * 
 * Fornisce funzioni server-side per costruire snapshot completi
 * per le email di booking. Devono essere eseguite con service role.
 */

export type { BookingEmailSnapshot, SupabaseAdminClient } from "./types.ts";
export { buildEventEmailSnapshot } from "./buildEventEmailSnapshot.ts";
export { buildBookingRequestEmailSnapshot } from "./buildBookingRequestEmailSnapshot.ts";
