interface PlanWeeksBadgeProps {
  weeks: number | null | undefined;
}

export function PlanWeeksBadge({ weeks }: PlanWeeksBadgeProps) {
  if (weeks === null || weeks === undefined) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const label = weeks >= 10 ? "10+ sett." : `${weeks} sett.`;

  return <span className="text-sm">{label}</span>;
}
