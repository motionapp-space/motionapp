import { useNavigate } from "react-router-dom";
import { Eye, Archive, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";
import { toSentenceCase } from "@/lib/text";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientWithDetails, ClientStatus } from "../types";
import { PlanWeeksBadge } from "./badges/PlanWeeksBadge";
import { PackageStatusBadge } from "./badges/PackageStatusBadge";
import { AppointmentStatusBadge } from "./badges/AppointmentStatusBadge";
import { ActivityStatusBadge } from "./badges/ActivityStatusBadge";

interface ClientsTableProps {
  rows: ClientWithDetails[];
  highlightId?: string;
  onArchive: (id: string, name: string) => void;
  onUnarchive: (id: string, name: string) => void;
}

const getStatusColor = (status: ClientStatus) => {
  switch (status) {
    case "ATTIVO":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    case "POTENZIALE":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "INATTIVO":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    case "ARCHIVIATO":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

function ClientRow({
  client,
  highlightId,
  onArchive,
  onUnarchive,
}: {
  client: ClientWithDetails;
  highlightId?: string;
  onArchive: (id: string, name: string) => void;
  onUnarchive: (id: string, name: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <TableRow className={client.id === highlightId ? "ring-2 ring-primary/60 bg-primary/5" : ""}>
      <TableCell className="font-medium">
        {client.first_name} {client.last_name}
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(client.status)} variant="secondary">
          {client.status}
        </Badge>
      </TableCell>
      <TableCell>{client.current_plan_name || "—"}</TableCell>
      <TableCell>
        <PlanWeeksBadge weeks={client.plan_weeks_since_assignment} />
      </TableCell>
      <TableCell>
        <PackageStatusBadge status={client.package_status} />
      </TableCell>
      <TableCell>
        <AppointmentStatusBadge status={client.appointment_status} />
      </TableCell>
      <TableCell>
        <ActivityStatusBadge status={client.activity_status} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <IconTooltipButton
            label={`Visualizza cliente ${client.first_name} ${client.last_name}`}
            onClick={() => navigate(`/clients/${client.id}`)}
            data-testid={`view-${client.id}`}
          >
            <Eye className="h-4 w-4" />
          </IconTooltipButton>
          {client.status === "ARCHIVIATO" ? (
            <IconTooltipButton
              label={`Ripristina cliente ${client.first_name} ${client.last_name}`}
              onClick={() => onUnarchive(client.id, `${client.first_name} ${client.last_name}`)}
              data-testid={`unarchive-${client.id}`}
            >
              <RotateCcw className="h-4 w-4" />
            </IconTooltipButton>
          ) : (
            <IconTooltipButton
              label={`Archivia cliente ${client.first_name} ${client.last_name}`}
              onClick={() => onArchive(client.id, `${client.first_name} ${client.last_name}`)}
              data-testid={`archive-${client.id}`}
            >
              <Archive className="h-4 w-4" />
            </IconTooltipButton>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ClientsTable({ rows, highlightId, onArchive, onUnarchive }: ClientsTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{toSentenceCase("Cliente")}</TableHead>
            <TableHead>{toSentenceCase("Stato")}</TableHead>
            <TableHead>{toSentenceCase("Piano")}</TableHead>
            <TableHead>{toSentenceCase("Pacchetto")}</TableHead>
            <TableHead>{toSentenceCase("Prossimo App.")}</TableHead>
            <TableHead>{toSentenceCase("Attività")}</TableHead>
            <TableHead className="text-right">{toSentenceCase("Azioni")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              highlightId={highlightId}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
