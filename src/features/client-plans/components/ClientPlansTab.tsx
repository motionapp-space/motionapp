import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Plus } from "lucide-react";
import { toSentenceCase } from "@/lib/text";
import { ClientPlanCard } from "./ClientPlanCard";
import { CreatePlanDialog } from "./CreatePlanDialog";
import type { ClientPlanWithTemplate } from "@/types/template";

interface ClientPlansTabProps {
  clientId: string;
  plans: ClientPlanWithTemplate[];
  isLoading: boolean;
  onDuplicate: (planId: string) => void;
  onToggleInUse: (planId: string, currentValue: boolean) => void;
  onComplete: (planId: string) => void;
  onArchive: (planId: string) => void;
  onDelete: (planId: string) => void;
  onToggleVisibility: (planId: string, currentValue: boolean) => void;
  onSaveAsTemplate: (planId: string) => void;
}

type FilterType = "all" | "in-use" | "active" | "completed" | "archived";

export function ClientPlansTab({
  clientId,
  plans,
  isLoading,
  onDuplicate,
  onToggleInUse,
  onComplete,
  onArchive,
  onDelete,
  onToggleVisibility,
  onSaveAsTemplate,
}: ClientPlansTabProps) {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "Tutti" },
    { value: "in-use", label: "In uso" },
    { value: "active", label: "Attivi" },
    { value: "completed", label: "Completati" },
    { value: "archived", label: "Archiviati" },
  ];

  const filteredPlans = plans.filter((plan) => {
    switch (activeFilter) {
      case "in-use":
        return plan.is_in_use;
      case "active":
        return plan.status === "IN_CORSO";
      case "completed":
        return plan.status === "COMPLETATO";
      case "archived":
        return plan.status === "ELIMINATO";
      default:
        return true;
    }
  });

  const sortedPlans = [...filteredPlans].sort((a, b) => {
    // Prima i piani In Uso
    if (a.is_in_use && !b.is_in_use) return -1;
    if (!a.is_in_use && b.is_in_use) return 1;

    // Poi per status: IN_CORSO > COMPLETATO > ELIMINATO
    const statusOrder = { IN_CORSO: 0, COMPLETATO: 1, ELIMINATO: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
      </div>
    );
  }

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
              {toSentenceCase("Gestisci i piani assegnati a questo cliente.")}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            {toSentenceCase("Nuovo piano")}
          </Button>
        </div>

        {/* Filters */}
        {plans.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {toSentenceCase(filter.label)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Plans List or Empty State */}
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
      ) : sortedPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {toSentenceCase("Nessun piano trovato per questo filtro.")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sortedPlans.map((plan) => (
            <ClientPlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => navigate(`/client-plans/${plan.id}/edit`)}
              onDuplicate={() => onDuplicate(plan.id)}
              onToggleInUse={() => onToggleInUse(plan.id, plan.is_in_use)}
              onComplete={() => onComplete(plan.id)}
              onArchive={() => onArchive(plan.id)}
              onDelete={() => onDelete(plan.id)}
              onToggleVisibility={() => onToggleVisibility(plan.id, plan.is_visible)}
              onSaveAsTemplate={() => onSaveAsTemplate(plan.id)}
            />
          ))}
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
