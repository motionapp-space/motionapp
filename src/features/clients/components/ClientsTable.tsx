import { useNavigate } from "react-router-dom";
import { Eye, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toSentenceCase } from "@/lib/text";
import type { ClientWithTags, ClientStatus } from "../types";

interface ClientsTableProps {
  rows: ClientWithTags[];
  highlightId?: string;
  onArchive: (id: string, name: string) => void;
  onUnarchive: (id: string, name: string) => void;
}

const getStatusColor = (status: ClientStatus) => {
  switch (status) {
    case "ATTIVO": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    case "POTENZIALE": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "SOSPESO": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    case "ARCHIVIATO": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    default: return "bg-gray-100 text-gray-800";
  }
};

export function ClientsTable({ rows, highlightId, onArchive, onUnarchive }: ClientsTableProps) {
  const navigate = useNavigate();
  
  console.log("rows:", rows.length, "unique:", new Set(rows.map(r=>r.id)).size, "ids:", rows.map(r=>r.id));

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{toSentenceCase("Nome")}</TableHead>
            <TableHead>{toSentenceCase("Email")}</TableHead>
            <TableHead>{toSentenceCase("Telefono")}</TableHead>
            <TableHead>{toSentenceCase("Stato")}</TableHead>
            <TableHead>{toSentenceCase("Tags")}</TableHead>
            <TableHead className="text-right">{toSentenceCase("Azioni")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((client) => (
            <TableRow
              key={client.id}
              className={client.id === highlightId ? "ring-2 ring-primary/60 bg-primary/5" : ""}
            >
              <TableCell className="font-medium">
                {client.last_name} {client.first_name}
              </TableCell>
              <TableCell>{client.email || "-"}</TableCell>
              <TableCell>{client.phone || "-"}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(client.status)} variant="secondary">
                  {client.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {client.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color }}>
                      {tag.label}
                    </Badge>
                  ))}
                  {(client.tags?.length || 0) > 2 && (
                    <Badge variant="outline">+{(client.tags?.length || 0) - 2}</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/clients/${client.id}`)}
                    aria-label={`Visualizza cliente ${client.first_name} ${client.last_name}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {client.status === "ARCHIVIATO" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUnarchive(client.id, `${client.first_name} ${client.last_name}`)}
                      aria-label={`Ripristina cliente ${client.first_name} ${client.last_name}`}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onArchive(client.id, `${client.first_name} ${client.last_name}`)}
                      aria-label={`Archivia cliente ${client.first_name} ${client.last_name}`}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
