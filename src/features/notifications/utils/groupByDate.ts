import { isToday, isYesterday, isWithinInterval, subDays, startOfDay } from "date-fns";
import type { CoachNotification } from "../types";

export interface GroupedNotifications {
  today: CoachNotification[];
  yesterday: CoachNotification[];
  lastWeek: CoachNotification[];
  older: CoachNotification[];
}

export function groupByDate(notifications: CoachNotification[]): GroupedNotifications {
  const now = new Date();
  const sevenDaysAgo = startOfDay(subDays(now, 7));
  const twoDaysAgo = startOfDay(subDays(now, 2));

  const result: GroupedNotifications = {
    today: [],
    yesterday: [],
    lastWeek: [],
    older: [],
  };

  for (const notification of notifications) {
    const date = new Date(notification.created_at);

    if (isToday(date)) {
      result.today.push(notification);
    } else if (isYesterday(date)) {
      result.yesterday.push(notification);
    } else if (isWithinInterval(date, { start: sevenDaysAgo, end: twoDaysAgo })) {
      result.lastWeek.push(notification);
    } else {
      result.older.push(notification);
    }
  }

  return result;
}

export function getGroupLabel(key: keyof GroupedNotifications): string {
  switch (key) {
    case "today":
      return "Oggi";
    case "yesterday":
      return "Ieri";
    case "lastWeek":
      return "Ultimi 7 giorni";
    case "older":
      return "Precedenti";
  }
}
