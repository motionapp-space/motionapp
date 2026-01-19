/**
 * Helper functions per template email.
 * Tutte le funzioni sono pure e deterministiche.
 */

/**
 * Formatta data ISO in formato leggibile italiano con data e ora.
 * @example "lunedì 20 gennaio 2025 alle 10:30"
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatta data ISO in formato leggibile italiano (solo data).
 * @example "lunedì 20 gennaio 2025"
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formatta data ISO in formato leggibile italiano (solo ora).
 * @example "10:30"
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatta range orario.
 * @example "10:30 - 11:30"
 */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} - ${formatTime(endIso)}`;
}
