import { formatDistanceToNowStrict, isToday, isYesterday, format } from "date-fns";
import { it } from "date-fns/locale";

/**
 * Formats a date as a relative time string following UX guidelines:
 * - < 1 min: "ora"
 * - < 60 min: "X min fa"
 * - < 24h: "X ore fa"
 * - Yesterday: "ieri"
 * - < 7 days: "X giorni fa"
 * - > 7 days: "DD MMM" (es. "12 gen")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return "ora";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} min fa`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24 && isToday(date)) {
    return `${diffInHours} ${diffInHours === 1 ? "ora" : "ore"} fa`;
  }

  if (isYesterday(date)) {
    return "ieri";
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "giorno" : "giorni"} fa`;
  }

  // More than 7 days: show date
  return format(date, "d MMM", { locale: it });
}
