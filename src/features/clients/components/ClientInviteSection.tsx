import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Check, Clock, AlertCircle, RefreshCw, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getClientInvite, createInvite, type ClientInvite } from "../api/invites.api";
import { toSentenceCase } from "@/lib/text";

interface ClientInviteSectionProps {
  clientId: string;
  email: string;
  hasUserAccount: boolean;
}

export function ClientInviteSection({ clientId, email, hasUserAccount }: ClientInviteSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const { data: invite, isLoading, refetch } = useQuery({
    queryKey: ["client-invite", clientId],
    queryFn: () => getClientInvite(clientId),
    enabled: !!clientId && !!email && !hasUserAccount,
  });

  // If client already has an account
  if (hasUserAccount) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="font-medium text-green-900">{toSentenceCase("Account attivo")}</p>
          <p className="text-sm text-green-700">
            Il cliente ha completato la registrazione e può accedere all'app.
          </p>
        </div>
      </div>
    );
  }

  // If no email configured
  if (!email) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted border">
        <div className="h-10 w-10 rounded-full bg-muted-foreground/10 flex items-center justify-center">
          <Mail className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-muted-foreground">{toSentenceCase("Email non configurata")}</p>
          <p className="text-sm text-muted-foreground">
            Aggiungi un'email al profilo del cliente per poter generare un link di invito.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleGenerateInvite = async () => {
    setIsGenerating(true);
    try {
      const result = await createInvite(clientId);
      if (result.success && result.inviteLink) {
        setGeneratedLink(result.inviteLink);
        
        // Show appropriate toast based on email status
        if (result.emailSent) {
          toast.success("Invito generato e email inviata!", {
            description: `Email inviata a ${result.email}`
          });
        } else {
          toast.success("Link di invito generato!", {
            description: result.emailError 
              ? "Email non inviata - condividi il link manualmente" 
              : undefined
          });
        }
        refetch();
      } else {
        toast.error("Errore nella generazione del link", {
          description: result.error || "Riprova più tardi"
        });
      }
    } catch (error) {
      toast.error("Errore nella generazione del link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiato!");
    } catch {
      toast.error("Impossibile copiare il link");
    }
  };

  const getStatusBadge = (status: ClientInvite["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">In attesa</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accettato</Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Scaduto</Badge>;
      case "revoked":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Revocato</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show generated link immediately after generation
  if (generatedLink) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-green-900">{toSentenceCase("Link generato!")}</p>
            <p className="text-sm text-green-700 truncate">{generatedLink}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleCopyLink(generatedLink)}
            className="shrink-0"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copia
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Condividi questo link con il cliente per permettergli di completare la registrazione.
        </p>
      </div>
    );
  }

  // No invite exists yet
  if (!invite) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted border">
          <div className="h-10 w-10 rounded-full bg-muted-foreground/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{toSentenceCase("Nessun invito inviato")}</p>
            <p className="text-sm text-muted-foreground">
              Genera un link di invito per permettere al cliente di creare il proprio account.
            </p>
          </div>
        </div>
        <Button onClick={handleGenerateInvite} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generazione...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Genera link di invito
            </>
          )}
        </Button>
      </div>
    );
  }

  // Invite exists
  const isExpired = invite.status === "expired" || new Date(invite.expires_at) < new Date();
  const isPending = invite.status === "pending" && !isExpired;

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={`flex items-start gap-3 p-4 rounded-lg border ${
        isPending ? "bg-yellow-50 border-yellow-200" : 
        isExpired ? "bg-red-50 border-red-200" : 
        "bg-muted"
      }`}>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
          isPending ? "bg-yellow-100" : 
          isExpired ? "bg-red-100" : 
          "bg-muted-foreground/10"
        }`}>
          {isPending ? (
            <Clock className="h-5 w-5 text-yellow-600" />
          ) : isExpired ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : (
            <Mail className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium">{toSentenceCase("Invito inviato")}</p>
            {getStatusBadge(isExpired ? "expired" : invite.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {isPending ? (
              <>Scade il {formatDate(invite.expires_at)}</>
            ) : isExpired ? (
              <>Scaduto il {formatDate(invite.expires_at)}</>
            ) : (
              <>Creato il {formatDate(invite.created_at)}</>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const inviteLink = `${window.location.origin}/client/accept-invite?token=${invite.token}`;
              handleCopyLink(inviteLink);
            }}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copia link
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateInvite}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {isExpired && (
        <Button onClick={handleGenerateInvite} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generazione...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Genera nuovo link
            </>
          )}
        </Button>
      )}
    </div>
  );
}
