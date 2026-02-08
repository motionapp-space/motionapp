import { useNavigate } from "react-router-dom";
import { Eye, Archive, RotateCcw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";
import { toSentenceCase } from "@/lib/text";
import { cn } from "@/lib/utils";
import type { ClientWithDetails } from "../types";
import { ActivePlanBadge } from "./badges/ActivePlanBadge";
import { PackageStatusBadge } from "./badges/PackageStatusBadge";
import { AppointmentStatusBadge } from "./badges/AppointmentStatusBadge";
import { ActivityStatusBadge } from "./badges/ActivityStatusBadge";

interface ClientsTableProps {
  rows: ClientWithDetails[];
  highlightId?: string;
  onArchive: (id: string, name: string) => void;
  onUnarchive: (id: string, name: string) => void;
}

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
    <TableRow 
      className={cn(
        "hover:bg-muted/30 transition-colors",
        client.id === highlightId ? "ring-2 ring-primary/60 bg-primary/5" : ""
      )}
    >
      <TableCell className="font-medium">
        {client.first_name} {client.last_name}
      </TableCell>
      <TableCell>
        <ActivePlanBadge hasActivePlan={client.has_active_plan} />
      </TableCell>
      <TableCell>
        <PackageStatusBadge 
          status={client.package_status}
          sessionsUsed={client.package_sessions_used}
          sessionsTotal={client.package_sessions_total}
        />
      </TableCell>
      <TableCell>
        <AppointmentStatusBadge 
          status={client.appointment_status}
          nextAppointmentDate={client.next_appointment_date}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-3">
          <IconTooltipButton
            label={`Visualizza cliente ${client.first_name} ${client.last_name}`}
            onClick={() => navigate(`/clients/${client.id}`)}
            data-testid={`view-${client.id}`}
          >
            <Eye className="h-4 w-4" />
          </IconTooltipButton>
          {client.isArchived ? (
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
        <TableHeader className="border-b-2 border-border/50">
          <TableRow>
            <TableHead>{toSentenceCase("Cliente")}</TableHead>
            <TableHead>{toSentenceCase("Piano")}</TableHead>
            <TableHead>{toSentenceCase("Pacchetto")}</TableHead>
            <TableHead>{toSentenceCase("Appuntamento")}</TableHead>
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
