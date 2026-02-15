// Generate consistent colors for clients using design tokens
const CLIENT_COLORS = [
  "hsl(var(--client-1))",
  "hsl(var(--client-2))",
  "hsl(var(--client-3))",
  "hsl(var(--client-4))",
  "hsl(var(--client-5))",
  "hsl(var(--client-6))",
  "hsl(var(--client-7))",
  "hsl(var(--client-8))",
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
