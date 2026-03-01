import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import SectionShell from "@/components/layout/SectionShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCoachesOverview } from "@/features/admin/hooks/useCoachesOverview";
import { CoachesOverviewTable } from "@/features/admin/components/CoachesOverviewTable";

export default function AdminCoaches() {
  const { data: coaches, isLoading, error } = useCoachesOverview();

  return (
    <SectionShell
      title="Coach iscritti"
      toolbar={
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <p className="text-sm text-muted-foreground py-8 text-center">Caricamento...</p>
          )}
          {error && (
            <p className="text-sm text-destructive py-8 text-center">
              Errore nel caricamento dei dati.
            </p>
          )}
          {coaches && <CoachesOverviewTable coaches={coaches} />}
        </CardContent>
      </Card>
    </SectionShell>
  );
}
