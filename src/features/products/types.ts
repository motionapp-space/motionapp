// Product Catalog Types

export type ProductType = 'session_pack' | 'single_session' | 'subscription';

export interface Product {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  type: ProductType;
  credits_amount: number;
  price_cents: number;
  duration_months: number;
  is_active: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  description?: string | null;
  type: ProductType;
  credits_amount: number;
  price_cents: number;
  duration_months: number;
  is_active?: boolean;
  is_visible?: boolean;
  sort_order?: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  type?: ProductType;
  credits_amount?: number;
  price_cents?: number;
  duration_months?: number;
  is_active?: boolean;
  is_visible?: boolean;
  sort_order?: number;
}

export interface CoachSettings {
  coach_id: string;
  lock_window_hours: number;
  currency_code: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateCoachSettingsInput {
  lock_window_hours?: number;
  currency_code?: string;
}
