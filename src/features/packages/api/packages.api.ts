import { supabase } from "@/integrations/supabase/client";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { getCoachClientId } from "@/lib/coach-client";
import { getProductByCredits } from "@/features/products/api/products.api";
import { getCoachSettings } from "@/features/products/api/coach-settings.api";
import type { 
  Package, 
  PackageWithClient, 
  CreatePackageInput, 
  UpdatePackageInput,
  PackageFilters,
  PackageSettings 
} from "../types";
import type { CoachSettings } from "@/features/products/types";

/**
 * Get all packages for a specific client
 */
export async function getClientPackages(clientId: string): Promise<Package[]> {
  const coachClientId = await getCoachClientId(clientId);

  const { data, error } = await supabase
    .from("package")
    .select("*")
    .eq("coach_client_id", coachClientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single package by ID
 */
export async function getPackage(packageId: string): Promise<Package> {
  const { data, error } = await supabase
    .from("package")
    .select("*")
    .eq("package_id", packageId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get active package for a client (if exists)
 */
export async function getActivePackage(clientId: string): Promise<Package | null> {
  const coachClientId = await getCoachClientId(clientId);

  const { data, error } = await supabase
    .from("package")
    .select("*")
    .eq("coach_client_id", coachClientId)
    .eq("usage_status", "active")
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Get active package by coach_client_id directly (if exists)
 */
export async function getActivePackageByCoachClient(coachClientId: string): Promise<Package | null> {
  const { data, error } = await supabase
    .from("package")
    .select("*")
    .eq("coach_client_id", coachClientId)
    .eq("usage_status", "active")
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new package
 */
export async function createPackage(input: CreatePackageInput): Promise<Package> {
  // Get client_id from coach_client
  const { data: cc } = await supabase
    .from("coach_clients")
    .select("client_id")
    .eq("id", input.coach_client_id)
    .single();

  if (!cc) throw new Error("Coach-client relationship not found");

  // Get price and duration from products catalog if not provided
  const product = await getProductByCredits(input.total_sessions);
  const defaultPrice = product?.price_cents ?? 5000; // fallback
  const defaultDuration = product?.duration_months ?? 1;

  let price = input.price_total_cents;
  let price_source: 'settings' | 'custom' = 'settings';

  if (price === undefined || price === null) {
    price = defaultPrice;
  } else if (price !== defaultPrice) {
    // Solo "custom" se il prezzo è diverso dal default
    price_source = 'custom';
  }

  let duration_months = input.duration_months;
  if (!duration_months) {
    duration_months = defaultDuration;
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
      coach_client_id: input.coach_client_id,
      name: input.name,
      total_sessions: input.total_sessions,
      price_total_cents: price,
      price_source,
      duration_months,
      expires_at,
      usage_status: 'active',
      payment_status: input.payment_status || 'unpaid',
      is_single_technical: input.is_single_technical || false,
      payment_method: input.payment_method,
      notes_internal: input.notes_internal,
    })
    .select()
    .single();

  if (error) throw error;
  
  // Log activity
  await logClientActivity(
    cc.client_id,
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
  // If changing price, mark as custom
  const updates: any = { ...input };
  if (input.price_total_cents !== undefined) {
    updates.price_source = 'custom';
  }

  const { data, error } = await supabase
    .from("package")
    .update(updates)
    .eq("package_id", packageId)
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
 * @deprecated Use getCoachSettings from @/features/products instead
 * Get or create package settings for the authenticated coach
 * This now uses the products catalog + coach_settings for backward compatibility
 */
export async function getPackageSettings(): Promise<PackageSettings> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Get coach settings
  const coachSettings = await getCoachSettings();
  
  // Get products to build legacy PackageSettings structure
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("coach_id", session.session.user.id)
    .eq("is_active", true)
    .order("credits_amount", { ascending: true });

  if (error) throw error;

  // Build legacy settings from products
  const buildSettings = (): PackageSettings => {
    const base: PackageSettings = {
      settings_id: coachSettings.coach_id, // using coach_id as ID
      coach_id: coachSettings.coach_id,
      sessions_1_price: 5000,
      sessions_1_duration: 1,
      sessions_3_price: 13500,
      sessions_3_duration: 2,
      sessions_5_price: 22500,
      sessions_5_duration: 3,
      sessions_10_price: 45000,
      sessions_10_duration: 6,
      sessions_15_price: 67500,
      sessions_15_duration: 9,
      sessions_20_price: 90000,
      sessions_20_duration: 12,
      currency_code: coachSettings.currency_code,
      lock_window_hours: coachSettings.lock_window_hours,
      created_at: coachSettings.created_at,
      updated_at: coachSettings.updated_at,
    };

    // Override with actual product values
    for (const product of products || []) {
      const key = `sessions_${product.credits_amount}` as const;
      if (key === 'sessions_1' || key === 'sessions_3' || key === 'sessions_5' || 
          key === 'sessions_10' || key === 'sessions_15' || key === 'sessions_20') {
        (base as any)[`${key}_price`] = product.price_cents;
        (base as any)[`${key}_duration`] = product.duration_months;
      }
    }

    return base;
  };

  return buildSettings();
}

/**
 * @deprecated Use updateProduct from @/features/products and updateCoachSettings instead
 * Update package settings - now updates products catalog
 */
export async function updatePackageSettings(
  settings: Partial<Omit<PackageSettings, 'settings_id' | 'coach_id' | 'created_at' | 'updated_at'>>
): Promise<PackageSettings> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Update coach_settings if lock_window_hours or currency_code changed
  if (settings.lock_window_hours !== undefined || settings.currency_code !== undefined) {
    const { updateCoachSettings } = await import("@/features/products/api/coach-settings.api");
    await updateCoachSettings({
      lock_window_hours: settings.lock_window_hours,
      currency_code: settings.currency_code,
    });
  }

  // Update products for each session type
  const sessionTypes = [1, 3, 5, 10, 15, 20] as const;
  
  for (const sessions of sessionTypes) {
    const priceKey = `sessions_${sessions}_price` as keyof typeof settings;
    const durationKey = `sessions_${sessions}_duration` as keyof typeof settings;
    
    if (settings[priceKey] !== undefined || settings[durationKey] !== undefined) {
      // Find the product
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("coach_id", session.session.user.id)
        .eq("credits_amount", sessions)
        .single();

      if (product) {
        const updates: Record<string, number> = {};
        if (settings[priceKey] !== undefined) updates.price_cents = settings[priceKey] as number;
        if (settings[durationKey] !== undefined) updates.duration_months = settings[durationKey] as number;

        await supabase
          .from("products")
          .update(updates)
          .eq("id", product.id);
      }
    }
  }

  // Return updated settings
  return getPackageSettings();
}

/**
 * List all packages for the authenticated coach (across all clients)
 */
export async function listAllPackages(filters?: PackageFilters): Promise<PackageWithClient[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  // Get coach_clients
  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id, client_id")
    .eq("coach_id", session.session.user.id);

  if (!coachClients || coachClients.length === 0) return [];

  let query = supabase
    .from("package")
    .select("*")
    .in("coach_client_id", coachClients.map(cc => cc.id));

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

  // Get client details
  const clientIds = coachClients.map(cc => cc.client_id);
  const { data: clients } = await supabase
    .from("clients")
    .select("id, first_name, last_name")
    .in("id", clientIds);

  const clientMap = new Map(clients?.map(c => [c.id, c]) || []);
  const ccMap = new Map(coachClients.map(cc => [cc.id, cc.client_id]));
  
  return (data || []).map(pkg => {
    const clientId = ccMap.get(pkg.coach_client_id);
    const client = clientId ? clientMap.get(clientId) : null;
    return {
      ...pkg,
      client_first_name: client?.first_name || '',
      client_last_name: client?.last_name || '',
    };
  });
}
