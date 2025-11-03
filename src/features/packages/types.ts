// Package Management Types

export type PackageUsageStatus = 'active' | 'completed' | 'suspended' | 'archived';
export type PackagePaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type LedgerType = 'HOLD_CREATE' | 'HOLD_RELEASE' | 'CONSUME' | 'CORRECTION';
export type LedgerReason = 'CONFIRM' | 'CANCEL_GT_24H' | 'CANCEL_LT_24H' | 'COMPLETE' | 'ADMIN_CORRECTION' | 'RECONCILE';

export interface Package {
  package_id: string;
  client_id: string;
  coach_id: string;
  name: string;
  total_sessions: number; // DB constraint ensures 1|5|10|20
  consumed_sessions: number;
  on_hold_sessions: number;
  price_total_cents: number | null;
  currency_code: string;
  price_source: string; // 'settings' | 'custom' in DB
  usage_status: string; // PackageUsageStatus in DB
  payment_status: string; // PackagePaymentStatus in DB
  expires_at: string | null;
  payment_method: string | null;
  notes_internal: string | null;
  is_single_technical: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackageWithClient extends Package {
  client_first_name: string;
  client_last_name: string;
}

export interface PackageKPI {
  remaining: number;           // total - consumed
  available: number;           // total - consumed - on_hold
  consumed: number;
  on_hold: number;
  total: number;
  price_per_session: number | null;
}

export interface LedgerEntry {
  ledger_id: string;
  package_id: string;
  calendar_event_id: string | null;
  type: LedgerType;
  reason: LedgerReason;
  delta_consumed: number;
  delta_hold: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface LedgerEntryWithEvent extends LedgerEntry {
  event_title: string | null;
  event_start_at: string | null;
}

export interface Payment {
  payment_id: string;
  package_id: string;
  amount_cents: number;
  currency_code: string;
  kind: 'charge' | 'refund' | 'deposit';
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PackageSettings {
  settings_id: string;
  coach_id: string;
  sessions_1_price: number;
  sessions_5_price: number;
  sessions_10_price: number;
  sessions_20_price: number;
  currency_code: string;
  lock_window_hours: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePackageInput {
  client_id: string;
  name: string;
  total_sessions: number; // Should be 1, 5, 10, or 20
  price_total_cents?: number | null;
  expires_at?: string | null;
  payment_method?: string | null;
  notes_internal?: string | null;
  payment_status?: PackagePaymentStatus;
}

export interface UpdatePackageInput {
  name?: string;
  price_total_cents?: number | null;
  expires_at?: string | null;
  payment_method?: string | null;
  notes_internal?: string | null;
  usage_status?: PackageUsageStatus;
  payment_status?: PackagePaymentStatus;
}

export interface CreateCorrectionInput {
  delta_consumed?: number;
  delta_hold?: number;
  note: string;
}

export interface PackageFilters {
  usage_status?: PackageUsageStatus[];
  payment_status?: PackagePaymentStatus[];
  is_single_technical?: boolean;
}
