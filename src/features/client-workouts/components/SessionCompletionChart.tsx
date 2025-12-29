import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

interface SessionCompletionChartProps {
  completed: number;
  total: number;
  size?: number;
}

export function SessionCompletionChart({ 
  completed, 
  total, 
  size = 48 
}: SessionCompletionChartProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  const data = [
    { value: percentage, fill: "hsl(var(--primary))" }
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        cx={size / 2}
        cy={size / 2}
        innerRadius={size * 0.35}
        outerRadius={size * 0.5}
        barSize={4}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          background={{ fill: "hsl(var(--muted))" }}
          dataKey="value"
          cornerRadius={2}
        />
      </RadialBarChart>
      
      {/* Center text */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ fontSize: size * 0.22 }}
      >
        <span className="font-semibold text-foreground">
          {completed}/{total}
        </span>
      </div>
    </div>
  );
}
