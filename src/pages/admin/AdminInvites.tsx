import { ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import SectionShell from "@/components/layout/SectionShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachInvitesList } from "@/features/admin/components/CoachInvitesList";
import { CreateInviteDialog } from "@/features/admin/components/CreateInviteDialog";
import { useCoachInvites } from "@/features/admin/hooks/useCoachInvites";

export default function AdminInvites() {
  const { data: invites = [], isLoading } = useCoachInvites();

  return (
    <SectionShell title="Inviti Coach">
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Home
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Gestione Inviti</CardTitle>
                <CardDescription>
                  Crea e gestisci inviti per nuovi coach
                </CardDescription>
              </div>
            </div>
            <CreateInviteDialog />
          </div>
        </CardHeader>
        <CardContent>
          <CoachInvitesList invites={invites} isLoading={isLoading} />
        </CardContent>
      </Card>
    </SectionShell>
  );
}
