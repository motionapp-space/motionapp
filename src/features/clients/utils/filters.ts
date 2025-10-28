import type { ClientsFilters, ClientStatus } from "../types";

export function getDefaultFilters(sp: URLSearchParams): ClientsFilters {
  const statusParam = sp.getAll("status");
  const defaultStatus: ClientStatus[] = statusParam.length > 0 
    ? statusParam as ClientStatus[]
    : ["ATTIVO", "POTENZIALE", "INATTIVO"];

  return {
    q: sp.get("q") || "",
    status: defaultStatus,
    tag: sp.get("tag") || "",
    sort: (sp.get("sort") as any) || "updated_desc",
    page: Number(sp.get("page")) || 1,
    limit: Number(sp.get("limit")) || 25,
  };
}

export function filtersToSearchParams(filters: ClientsFilters): URLSearchParams {
  const sp = new URLSearchParams();
  
  if (filters.q) sp.set("q", filters.q);
  if (filters.status && filters.status.length > 0) {
    filters.status.forEach(s => sp.append("status", s));
  }
  if (filters.tag) sp.set("tag", filters.tag);
  if (filters.sort) sp.set("sort", filters.sort);
  if (filters.page) sp.set("page", String(filters.page));
  if (filters.limit) sp.set("limit", String(filters.limit));
  
  return sp;
}
