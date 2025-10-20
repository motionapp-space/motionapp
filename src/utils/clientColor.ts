const TOKENS = [
  { bg: "bg-client-1", text: "text-white", ring: "ring-client-1", dot: "bg-client-1" },
  { bg: "bg-client-2", text: "text-white", ring: "ring-client-2", dot: "bg-client-2" },
  { bg: "bg-client-3", text: "text-white", ring: "ring-client-3", dot: "bg-client-3" },
  { bg: "bg-client-4", text: "text-white", ring: "ring-client-4", dot: "bg-client-4" },
  { bg: "bg-client-5", text: "text-white", ring: "ring-client-5", dot: "bg-client-5" },
  { bg: "bg-client-6", text: "text-white", ring: "ring-client-6", dot: "bg-client-6" },
  { bg: "bg-client-7", text: "text-white", ring: "ring-client-7", dot: "bg-client-7" },
  { bg: "bg-client-8", text: "text-white", ring: "ring-client-8", dot: "bg-client-8" },
];

export function colorClassesForClient(clientId: string) {
  let h = 0;
  for (let i = 0; i < clientId.length; i++) h = (h * 31 + clientId.charCodeAt(i)) >>> 0;
  return TOKENS[h % TOKENS.length];
}
