import { useState, useMemo } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CoachOverview } from "../api/coaches.api";

interface Props {
  coaches: CoachOverview[];
}

type SortDirection = "asc" | "desc";

export function CoachesOverviewTable({ coaches }: Props) {
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedCoaches = useMemo(() => {
    return [...coaches].sort((a, b) => {
      const nameA = [a.first_name, a.last_name].filter(Boolean).join(" ").toLowerCase();
      const nameB = [b.first_name, b.last_name].filter(Boolean).join(" ").toLowerCase();
      const cmp = nameA.localeCompare(nameB, "it");
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [coaches, sortDirection]);

  if (coaches.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Nessun coach registrato.</p>;
  }

  const SortIcon = sortDirection === "asc" ? ArrowUp : ArrowDown;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            className="cursor-pointer select-none hover:text-foreground transition-colors"
            onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
          >
            <span className="inline-flex items-center gap-1">
              Nome
              <SortIcon className="h-3.5 w-3.5" />
            </span>
          </TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-center">Clienti attivi</TableHead>
          <TableHead className="text-center">Eventi</TableHead>
          <TableHead className="text-center">Piani</TableHead>
          <TableHead>Ultimo accesso</TableHead>
          <TableHead>Iscritto dal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedCoaches.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">
              {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
            </TableCell>
            <TableCell>{c.email}</TableCell>
            <TableCell className="text-center">{c.active_clients_count}</TableCell>
            <TableCell className="text-center">{c.total_events_count}</TableCell>
            <TableCell className="text-center">{c.total_plans_count}</TableCell>
            <TableCell>
              {c.last_sign_in_at
                ? format(new Date(c.last_sign_in_at), "dd MMM yyyy HH:mm", { locale: it })
                : "Mai"}
            </TableCell>
            <TableCell>
              {format(new Date(c.created_at), "dd MMM yyyy", { locale: it })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
