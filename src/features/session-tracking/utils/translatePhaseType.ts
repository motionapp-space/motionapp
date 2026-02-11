/**
 * Translates snapshot phase type strings to Italian labels.
 * Shared between LiveSession and SessionDetailSheet.
 * 
 * Robust normalization: lowercase, strip separators, trim.
 */
export function translatePhaseType(phaseType: string | undefined | null): string {
  if (!phaseType) return '';
  const key = phaseType.toLowerCase().replace(/[_-]/g, ' ').trim();
  switch (key) {
    case 'warm up':
    case 'warmup':
      return 'Riscaldamento';
    case 'main':
    case 'main workout':
      return 'Corpo principale';
    case 'cooldown':
    case 'cool down':
      return 'Defaticamento';
    case 'stretching':
      return 'Stretching';
    default:
      return phaseType;
  }
}
