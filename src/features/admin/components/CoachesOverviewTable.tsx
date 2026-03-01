import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CoachOverview } from "../api/coaches.api";

interface Props {
  coaches: CoachOverview[];
}

export function CoachesOverviewTable({ coaches }: Props) {
  if (coaches.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Nessun coach registrato.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-center">Clienti attivi</TableHead>
          <TableHead className="text-center">Eventi</TableHead>
          <TableHead className="text-center">Piani</TableHead>
          <TableHead>Ultimo accesso</TableHead>
          <TableHead>Iscritto dal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {coaches.map((c) => (
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
