import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Plus, Star } from "lucide-react";
import { toSentenceCase } from "@/lib/text";
import { ClientPlanCard } from "./ClientPlanCard";
import { CreatePlanDialog } from "./CreatePlanDialog";
import type { ClientPlanWithActive } from "../types";

interface ClientPlansTabProps {
  clientId: string;
  plans: ClientPlanWithActive[];
  isLoading: boolean;
  onSetActive: (planId: string | null) => void;
  onDuplicate: (planId: string) => void;
  onDelete: (planId: string) => void;
  onSaveAsTemplate: (planId: string) => void;
}

export function ClientPlansTab({
  clientId,
  plans,
  isLoading,
  onSetActive,
  onDuplicate,
  onDelete,
  onSaveAsTemplate,
}: ClientPlansTabProps) {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
      </div>
    );
  }

  // Split plans into active and others
  const activePlan = plans.find((p) => p.isActiveForClient);
  const otherPlans = plans.filter((p) => !p.isActiveForClient);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {toSentenceCase("Piani di allenamento")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Il piano "In uso" è quello visibile al cliente e usato per scegliere i giorni quando crei una nuova sessione.
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            {toSentenceCase("Nuovo piano")}
          </Button>
        </div>
      </div>

      {/* No plans at all */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={FileText}
              title="Nessun piano assegnato"
              description="Crea un nuovo piano da zero o usa un template salvato nella libreria."
              action={{
                label: "Crea nuovo piano",
                onClick: () => setCreateDialogOpen(true),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Section: Piano in uso */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Piano in uso
              </h3>
            </div>
            
            {activePlan ? (
              <ClientPlanCard
                plan={activePlan}
                isActive={true}
                onEdit={() => navigate(`/client-plans/${activePlan.id}/edit`)}
                onDuplicate={() => onDuplicate(activePlan.id)}
                onDelete={() => onDelete(activePlan.id)}
                onSaveAsTemplate={() => onSaveAsTemplate(activePlan.id)}
              />
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nessun piano in uso. Imposta un piano come in uso per renderlo visibile al cliente.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Section: Altri piani */}
          {otherPlans.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Altri piani
              </h3>
              <div className="grid gap-3">
                {otherPlans.map((plan) => (
                  <ClientPlanCard
                    key={plan.id}
                    plan={plan}
                    isActive={false}
                    onEdit={() => navigate(`/client-plans/${plan.id}/edit`)}
                    onSetActive={() => onSetActive(plan.id)}
                    onDuplicate={() => onDuplicate(plan.id)}
                    onDelete={() => onDelete(plan.id)}
                    onSaveAsTemplate={() => onSaveAsTemplate(plan.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CreatePlanDialog
        clientId={clientId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
