/**
 * Session Tracking Formatters
 * 
 * Pure utility functions for formatting session data.
 * Extracted for testability and reuse.
 */

/**
 * Format rest time in seconds to MM:SS display
 * Always clamps negative values to 00:00 (MVP: never show negative)
 */
export function formatRestTime(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Generate a human-readable abbreviation for exercise names
 * Handles Italian exercise naming conventions:
 * - "Panca piana" → "Panca" (generic second word)
 * - "Trazioni lat" → "Trazi. L" (differentiation needed)
 * - "Curl" → "Curl" (single word)
 */
export function getExerciseAbbrev(name: string | undefined): string {
  if (!name || name.trim() === '') return 'Ex';
  
  const words = name.trim().split(/\s+/);
  const first = words[0];
  
  // Single word: just return it (truncated if long)
  if (words.length === 1) {
    return first.slice(0, 6);
  }
  
  // Common Italian generic second words - just use first word
  const genericSecondWords = [
    'piana', 'inclinata', 'declinata', 'stretta', 'larga',
    'frontale', 'laterale', 'posteriore', 'anteriore',
  ];
  
  const secondWord = words[1]?.toLowerCase() || '';
  if (genericSecondWords.includes(secondWord)) {
    return first.slice(0, 6);
  }
  
  // Multi-word needing differentiation: "Trazi. L" / "Trazi. S"
  const abbrevFirst = first.slice(0, 5);
  const secondInitial = words[1]?.[0]?.toUpperCase() || '';
  
  return secondInitial ? `${abbrevFirst}. ${secondInitial}` : abbrevFirst;
}

/**
 * Format an exercise actual for display in series chips
 * Handles bodyweight additions (+ prefix) differently from normal loads
 * 
 * Examples:
 * - formatExerciseActual("Panca", "10", "80") → "Panca 10×80kg"
 * - formatExerciseActual("Trazi", "10", "+20") → "Trazi 10 (+20kg)"
 * - formatExerciseActual("Curl", "12", null) → "Curl 12"
 */
export function formatExerciseActual(
  abbrev: string, 
  reps: string | number, 
  load: string | number | null | undefined
): string {
  if (!load) {
    return `${abbrev} ${reps}`;
  }
  
  const loadStr = String(load);
  // Remove duplicate kg suffix if present
  const cleanLoad = loadStr.replace(/kg$/i, '').trim();
  
  // For bodyweight additions (starts with +), use parentheses
  if (cleanLoad.startsWith('+')) {
    return `${abbrev} ${reps} (${cleanLoad}kg)`;
  }
  
  // Normal load: use × notation
  return `${abbrev} ${reps}×${cleanLoad}kg`;
}

/**
 * Format load display for single exercise chips
 * 
 * Examples:
 * - formatLoadDisplay("10", "80") → "10×80kg"
 * - formatLoadDisplay("10", "+20") → "10 (+20kg)"
 * - formatLoadDisplay("10", null) → "10"
 */
export function formatLoadDisplay(
  reps: string | number, 
  load: string | number | null | undefined
): string {
  if (!load) return String(reps);
  
  const loadStr = String(load).replace(/kg$/i, '').trim();
  
  if (loadStr.startsWith('+')) {
    return `${reps} (${loadStr}kg)`;
  }
  
  return `${reps}×${loadStr}kg`;
}
