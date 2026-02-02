import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CoachInvite, getInviteStatus } from "../api/coachInvites.api";
import { toast } from "sonner";

interface CoachInvitesListProps {
  invites: CoachInvite[];
  isLoading: boolean;
}

export function CoachInvitesList({ invites, isLoading }: CoachInvitesListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = async (code: string, id: string) => {
    const link = `${window.location.origin}/auth?invite=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      toast.success("Link copiato negli appunti");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Errore nella copia del link");
    }
  };

  const getStatusBadge = (invite: CoachInvite) => {
    const status = getInviteStatus(invite);
    
    switch (status) {
      case "valid":
        return <Badge variant="default" className="bg-green-600">Valido</Badge>;
      case "expired":
        return <Badge variant="secondary" className="bg-yellow-500 text-black">Scaduto</Badge>;
      case "used":
        return <Badge variant="destructive">Usato</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nessun invito creato. Clicca "Crea invito coach" per iniziare.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Codice</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Creato</TableHead>
          <TableHead>Scadenza</TableHead>
          <TableHead className="text-right">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invites.map((invite) => (
          <TableRow key={invite.id}>
            <TableCell className="font-mono font-medium">{invite.code}</TableCell>
            <TableCell>{getStatusBadge(invite)}</TableCell>
            <TableCell>
              {format(new Date(invite.created_at), "d MMM yyyy", { locale: it })}
            </TableCell>
            <TableCell>
              {format(new Date(invite.expires_at), "d MMM yyyy", { locale: it })}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyLink(invite.code, invite.id)}
                disabled={getInviteStatus(invite) !== "valid"}
              >
                {copiedId === invite.id ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Copia link</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
