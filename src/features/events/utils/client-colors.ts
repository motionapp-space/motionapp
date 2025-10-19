// Generate consistent colors for clients
const CLIENT_COLORS = [
  "hsl(var(--primary))",
  "hsl(220, 90%, 56%)", // blue
  "hsl(142, 71%, 45%)", // green
  "hsl(262, 83%, 58%)", // purple
  "hsl(24, 95%, 53%)",  // orange
  "hsl(199, 89%, 48%)", // cyan
  "hsl(326, 78%, 69%)", // pink
  "hsl(45, 93%, 47%)",  // yellow
  "hsl(168, 76%, 42%)", // teal
  "hsl(346, 87%, 43%)", // red
];

const clientColorMap = new Map<string, string>();

export function getClientColor(clientId: string): string {
  if (!clientColorMap.has(clientId)) {
    const index = clientColorMap.size % CLIENT_COLORS.length;
    clientColorMap.set(clientId, CLIENT_COLORS[index]);
  }
  return clientColorMap.get(clientId)!;
}

export function getClientColorWithOpacity(clientId: string, opacity: number = 0.1): string {
  const color = getClientColor(clientId);
  // Extract HSL values and add alpha
  const hslMatch = color.match(/hsl\(([^)]+)\)/);
  if (hslMatch) {
    return `hsl(${hslMatch[1]} / ${opacity})`;
  }
  return color;
}
