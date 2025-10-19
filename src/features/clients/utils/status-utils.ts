export const STATUS = ["ATTIVO", "POTENZIALE", "SOSPESO", "ARCHIVIATO"] as const;
export type Status = typeof STATUS[number];

export const DEFAULT_STATUS: Status[] = ["ATTIVO", "POTENZIALE", "SOSPESO"];

export function parseStatusFromSearch(sp: URLSearchParams): Status[] | null {
  const vals = sp.getAll("status") as Status[];
  const valid = vals.filter(v => STATUS.includes(v));
  return valid.length ? valid : null;
}

export function statusLabel(values: Status[]): string {
  const set = new Set(values);
  if (equalSets(set, new Set(DEFAULT_STATUS))) return "Tutti (non archiviati)";
  if (values.length === 1) return labelFor(values[0]);
  return values.map(labelFor).join(", ");
}

function labelFor(s: Status): string {
  switch (s) {
    case "ATTIVO": return "Attivo";
    case "POTENZIALE": return "Potenziale";
    case "SOSPESO": return "Sospeso";
    case "ARCHIVIATO": return "Archiviato";
  }
}

function equalSets(a: Set<unknown>, b: Set<unknown>) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function encodeStatus(arr: Status[]): string {
  return arr.join(",");
}

export function decodeStatus(s: string): Status[] {
  const list = s.split(",").filter(Boolean) as Status[];
  return list.length ? list : DEFAULT_STATUS;
}
