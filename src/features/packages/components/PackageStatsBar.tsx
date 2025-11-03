interface StatItem {
  label: string;
  value: number;
  highlight?: 'success' | 'warning' | 'info';
}

interface PackageStatsBarProps {
  stats: StatItem[];
}

export function PackageStatsBar({ stats }: PackageStatsBarProps) {
  const getHighlightColor = (highlight?: string) => {
    switch (highlight) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'info':
        return 'text-info';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-muted/30">
      {stats.map((stat, index) => (
        <div key={index} className="text-center space-y-1">
          <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
            {stat.label}
          </p>
          <p className={`text-2xl font-bold ${getHighlightColor(stat.highlight)}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
