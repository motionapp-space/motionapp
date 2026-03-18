import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { TabHeader } from "@/components/ui/tab-header";
import { FileText, Plus, Sparkles } from "lucide-react";
import { ClientPlanCard } from "./ClientPlanCard";
import { CreatePlanDialog } from "./CreatePlanDialog";
import { MagicImportModal } from "./MagicImportModal";
import { PlanPreviewEditorModal } from "./PlanPreviewEditorModal";
import { useCreateClientPlan } from "../hooks/useCreateClientPlan";
import type { ClientPlanWithActive } from "../types";
import type { Plan } from "@/types/plan";

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
  const [magicImportOpen, setMagicImportOpen] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<Plan | null>(null);
  const createPlanMutation = useCreateClientPlan();

  const handleMagicImportSuccess = (parsedPlan: Plan) => {
    setMagicImportOpen(false);
    setPreviewPlan(parsedPlan);
  };

  const handleConfirmImport = async (finalPlan: Plan) => {
    try {
      await createPlanMutation.mutateAsync({
        clientId: clientId,
        name: finalPlan.name || "Nuovo piano da AI",
        description: "Generato tramite Importazione Magica (AI)",
        days: finalPlan.days
      });
      setPreviewPlan(null);
      toast.success("Piano importato con successo!");
    } catch (err) {
      console.error("Errore salvataggio piano importato:", err);
    }
  };

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
      <TabHeader
        title="Piani di allenamento"
        subtitle="Programmi di allenamento assegnati al cliente e visibili nell'app"
        action={
          <div className="flex gap-2">
            <Button onClick={() => setMagicImportOpen(true)} size="sm" variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/10">
              <Sparkles className="h-4 w-4" />
              Importa con AI
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nuovo piano
            </Button>
          </div>
        }
      />

      {/* No plans at all */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={FileText}
              title="Nessun piano assegnato"
              description="Crea un piano di allenamento per mostrare al cliente come allenarsi e quali esercizi svolgere, e avere una base per le sessioni di allenamento."
              action={{
                label: "Importa con AI",
                onClick: () => setMagicImportOpen(true),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6">
          {/* Section: Piano attivo */}
          <div>
            <h3 className="text-xs font-medium tracking-widest text-muted-foreground/70 uppercase mb-3">
              Piano attivo
            </h3>
            
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
              <Card className="border-dashed border-border/60">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nessun piano attivo. Imposta un piano come attivo per renderlo visibile al cliente.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Section: Altri piani */}
          {otherPlans.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-medium tracking-widest text-muted-foreground/70 uppercase mb-3">
                Altri piani
              </h3>
              <div className="space-y-4">
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

      <MagicImportModal
        open={magicImportOpen}
        onOpenChange={setMagicImportOpen}
        onSuccess={handleMagicImportSuccess}
      />

      <PlanPreviewEditorModal
        open={!!previewPlan}
        onOpenChange={(open) => {
          if (!open) setPreviewPlan(null);
        }}
        initialPlan={previewPlan}
        onConfirm={handleConfirmImport}
      />
    </div>
  );
}
