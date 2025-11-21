import { supabase } from "@/integrations/supabase/client";
import { logClientActivity } from "@/features/clients/api/activities.api";
import type { 
  Package, 
  PackageWithClient, 
  CreatePackageInput, 
  UpdatePackageInput,
  PackageFilters,
  PackageSettings 
} from "../types";

/**
 * Get all packages for a specific client
 */
export async function getClientPackages(clientId: string): Promise<Package[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("package")
    .select("*")
    .eq("client_id", clientId)
    .eq("coach_id", session.session.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single package by ID
 */
export async function getPackage(packageId: string): Promise<Package> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("package")
    .select("*")
    .eq("package_id", packageId)
    .eq("coach_id", session.session.user.id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get active package for a client (if exists)
 */
export async function getActivePackage(clientId: string): Promise<Package | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("package")
    .select("*")
    .eq("client_id", clientId)
    .eq("coach_id", session.session.user.id)
    .eq("usage_status", "active")
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new package
 */
export async function createPackage(input: CreatePackageInput): Promise<Package> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Check if an active package already exists for this client
  const existingActive = await getActivePackage(input.client_id);
  if (existingActive) {
    throw new Error("Esiste già un pacchetto attivo per questo cliente");
  }

  // Get price and duration from settings if not provided
  const settings = await getPackageSettings();
  
  let price = input.price_total_cents;
  let price_source: 'settings' | 'custom' = 'settings';

  if (price === undefined || price === null) {
    const priceKey = `sessions_${input.total_sessions}_price` as keyof PackageSettings;
    price = settings[priceKey] as number;
  } else {
    price_source = 'custom';
  }

  let duration_months = input.duration_months;
  if (!duration_months) {
    const durationKey = `sessions_${input.total_sessions}_duration` as keyof PackageSettings;
    duration_months = settings[durationKey] as number;
  }

  // Calculate expires_at from duration_months if not explicitly provided
  let expires_at = input.expires_at;
  if (!expires_at) {
    const expiresDate = new Date();
    expiresDate.setMonth(expiresDate.getMonth() + duration_months);
    expires_at = expiresDate.toISOString();
  }

  const { data, error } = await supabase
    .from("package")
    .insert({
      ...input,
      coach_id: session.session.user.id,
      price_total_cents: price,
      price_source,
      duration_months,
      expires_at,
      usage_status: 'active',
      payment_status: input.payment_status || 'unpaid',
      is_single_technical: input.is_single_technical || false,
    })
    .select()
    .single();

  if (error) throw error;
  
  // Log activity
  await logClientActivity(
    data.client_id,
    "PACKAGE_CREATED",
    `Pacchetto "${data.name}" creato`
  );
  
  return data;
}

/**
 * Update an existing package
 */
export async function updatePackage(
  packageId: string, 
  input: UpdatePackageInput
): Promise<Package> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // If changing price, mark as custom
  const updates: any = { ...input };
  if (input.price_total_cents !== undefined) {
    updates.price_source = 'custom';
  }

  const { data, error } = await supabase
    .from("package")
    .update(updates)
    .eq("package_id", packageId)
    .eq("coach_id", session.session.user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Archive a package (only if on_hold_sessions = 0)
 */
export async function archivePackage(packageId: string): Promise<Package> {
  const pkg = await getPackage(packageId);
  
  if (pkg.on_hold_sessions > 0) {
    throw new Error(
      `Impossibile archiviare: ci sono ${pkg.on_hold_sessions} sessioni in attesa. ` +
      "Completa o annulla gli eventi prima di archiviare."
    );
  }

  return updatePackage(packageId, { usage_status: 'archived' });
}

/**
 * Suspend/Reactivate a package
 */
export async function togglePackageSuspension(packageId: string): Promise<Package> {
  const pkg = await getPackage(packageId);
  const newStatus = pkg.usage_status === 'suspended' ? 'active' : 'suspended';
  return updatePackage(packageId, { usage_status: newStatus });
}


/**
 * Get or create package settings for the authenticated coach
 */
export async function getPackageSettings(): Promise<PackageSettings> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  let { data, error } = await supabase
    .from("package_settings")
    .select("*")
    .eq("coach_id", session.session.user.id)
    .maybeSingle();

  // Create default settings if they don't exist
  if (!data && !error) {
    const { data: newSettings, error: insertError } = await supabase
      .from("package_settings")
      .insert({
        coach_id: session.session.user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newSettings;
  }

  if (error) throw error;
  return data!;
}

/**
 * Update package settings
 */
export async function updatePackageSettings(
  settings: Partial<Omit<PackageSettings, 'settings_id' | 'coach_id' | 'created_at' | 'updated_at'>>
): Promise<PackageSettings> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("package_settings")
    .update(settings)
    .eq("coach_id", session.session.user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List all packages for the authenticated coach (across all clients)
 */
export async function listAllPackages(filters?: PackageFilters): Promise<PackageWithClient[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  let query = supabase
    .from("package")
    .select(`
      *,
      clients!package_client_id_fkey(first_name, last_name)
    `)
    .eq("coach_id", session.session.user.id);

  if (filters?.usage_status && filters.usage_status.length > 0) {
    query = query.in("usage_status", filters.usage_status);
  }

  if (filters?.payment_status && filters.payment_status.length > 0) {
    query = query.in("payment_status", filters.payment_status);
  }

  if (filters?.is_single_technical !== undefined) {
    query = query.eq("is_single_technical", filters.is_single_technical);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  
  return (data || []).map(pkg => ({
    ...pkg,
    client_first_name: pkg.clients?.first_name || '',
    client_last_name: pkg.clients?.last_name || '',
  }));
}
