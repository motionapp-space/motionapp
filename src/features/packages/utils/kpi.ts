import type { Package, PackageKPI } from "../types";

/**
 * Calculate package KPIs
 */
export function calculatePackageKPI(pkg: Package): PackageKPI {
  const remaining = pkg.total_sessions - pkg.consumed_sessions;
  const available = pkg.total_sessions - pkg.consumed_sessions - pkg.on_hold_sessions;
  
  const price_per_session = pkg.price_total_cents 
    ? pkg.price_total_cents / pkg.total_sessions 
    : null;

  return {
    remaining,
    available,
    consumed: pkg.consumed_sessions,
    on_hold: pkg.on_hold_sessions,
    total: pkg.total_sessions,
    price_per_session,
  };
}

/**
 * Format currency for display (EUR)
 */
export function formatCurrency(cents: number | null): string {
  if (cents === null) return "N/D";
  const euros = cents / 100;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(euros);
}

/**
 * Get usage status display info
 */
export function getUsageStatusInfo(status: Package['usage_status']) {
  const statusMap = {
    active: { label: 'Attivo', icon: '🟢', color: 'text-success' },
    completed: { label: 'Completato', icon: '🔴', color: 'text-destructive' },
    suspended: { label: 'Sospeso', icon: '⚪', color: 'text-muted' },
    archived: { label: 'Archiviato', icon: '📁', color: 'text-muted-foreground' },
  };
  return statusMap[status];
}

/**
 * Get payment status display info
 */
export function getPaymentStatusInfo(status: Package['payment_status']) {
  const statusMap = {
    unpaid: { label: 'Da pagare', icon: '🟠', color: 'text-warning' },
    partial: { label: 'Acconto', icon: '🟡', color: 'text-yellow-600' },
    paid: { label: 'Pagato', icon: '🟢', color: 'text-success' },
    refunded: { label: 'Rimborsato', icon: '🌀', color: 'text-info' },
  };
  return statusMap[status];
}

/**
 * Get package name suggestion based on sessions
 */
export function suggestPackageName(sessions: number): string {
  const nameMap: Record<number, string> = {
    1: "1 lezione individuale",
    5: "5 lezioni individuali",
    10: "10 lezioni individuali",
    20: "20 lezioni individuali",
  };
  return nameMap[sessions] || `${sessions} lezioni`;
}
