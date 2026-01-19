/**
 * Elapsed time computation for session tracking
 * 
 * Uses timestamps rather than intervals for accuracy across page refreshes,
 * tab switches, and device sleep.
 */

export interface ElapsedParams {
  startedAtMs: number;
  pausedAtMs: number | null;
  accumulatedPauseMs: number;
  nowMs: number;
}

/**
 * Compute elapsed seconds of active session time
 * 
 * @param params - Timing parameters
 * @returns Non-negative elapsed seconds (floored)
 * 
 * Formula:
 * - If paused: (pausedAtMs - startedAtMs - accumulatedPauseMs) / 1000
 * - If running: (nowMs - startedAtMs - accumulatedPauseMs) / 1000
 */
export function computeElapsedSeconds(params: ElapsedParams): number {
  const { startedAtMs, pausedAtMs, accumulatedPauseMs, nowMs } = params;
  
  if (!startedAtMs || startedAtMs <= 0) {
    return 0;
  }
  
  // If currently paused, count up to the pause moment only
  if (pausedAtMs !== null && pausedAtMs > 0) {
    const activeDuration = pausedAtMs - startedAtMs - accumulatedPauseMs;
    return Math.max(0, Math.floor(activeDuration / 1000));
  }
  
  // If running, count up to now
  const activeDuration = nowMs - startedAtMs - accumulatedPauseMs;
  return Math.max(0, Math.floor(activeDuration / 1000));
}

/**
 * Format seconds as MM:SS or HH:MM:SS
 */
export function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  
  return `${pad(minutes)}:${pad(seconds)}`;
}
