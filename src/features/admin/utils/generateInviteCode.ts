/**
 * Generate a readable invite code in format MOTION-XXXX
 * Uses unambiguous characters (excludes I, O, 0, 1)
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MOTION-${suffix}`;
}
