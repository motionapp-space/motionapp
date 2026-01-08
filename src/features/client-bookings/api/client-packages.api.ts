/**
 * API functions for Client Packages
 * Fetches packages available to the client for booking requests
 */

import { supabase } from "@/integrations/supabase/client";
import { getClientCoachClientId } from "@/lib/coach-client";

export interface ClientPackageOption {
  packageId: string;
  name: string;
  available: number;
  expiresAt: string | null;
  isFefoDefault: boolean;
}

/**
 * Get valid packages for the client, filtered by slot end time
 * Returns packages sorted FEFO (earliest expiry first, then created_at)
 */
export async function getClientValidPackages(slotEndAt: string): Promise<ClientPackageOption[]> {
  const { coachClientId } = await getClientCoachClientId();
  const slotEnd = new Date(slotEndAt);

  const { data, error } = await supabase
    .from("package")
    .select("package_id, name, total_sessions, consumed_sessions, on_hold_sessions, expires_at, usage_status, created_at")
    .eq("coach_client_id", coachClientId)
    .eq("usage_status", "active")
    .order("expires_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Filter packages valid for the slot
  const validPackages = (data || [])
    .filter(pkg => {
      const available = pkg.total_sessions - pkg.consumed_sessions - pkg.on_hold_sessions;
      const notExpired = !pkg.expires_at || new Date(pkg.expires_at) >= slotEnd;
      return available > 0 && notExpired;
    })
    .map((pkg, index) => ({
      packageId: pkg.package_id,
      name: pkg.name,
      available: pkg.total_sessions - pkg.consumed_sessions - pkg.on_hold_sessions,
      expiresAt: pkg.expires_at,
      isFefoDefault: index === 0, // First in list = FEFO default
    }));

  return validPackages;
}
