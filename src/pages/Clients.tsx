import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Plus, Search, UserPlus, ChevronDown, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toSentenceCase } from "@/lib/text";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useCreateClient } from "@/features/clients/hooks/useCreateClient";
import { useArchiveClient } from "@/features/clients/hooks/useArchiveClient";
import { useUnarchiveClient } from "@/features/clients/hooks/useUnarchiveClient";
import { getDefaultFilters, filtersToSearchParams } from "@/features/clients/utils/filters";
import { ClientsTable } from "@/features/clients/components/ClientsTable";
import { getClientById } from "@/features/clients/api/clients.api";
import type { ClientStatus, ClientsFilters } from "@/features/clients/types";
import { cn } from "@/lib/utils";

const Clients = () => {
  const [sp, setSp] = useSearchParams();
  const qc = useQueryClient();

  const highlight = sp.get("highlight");
  const from = sp.get("from");

  const [filters, setFiltersState] = useState<ClientsFilters>(getDefaultFilters(sp));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { data, isLoading } = useClientsQuery(filters);
  const createMutation = useCreateClient();
  const archiveMutation = useArchiveClient();
  const unarchiveMutation = useUnarchiveClient();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    fiscal_code: "",
    notes: "",
  });

  // Handle return from create flow
  useEffect(() => {
    if (from === "create") {
      const newSp = new URLSearchParams(sp);
      newSp.set("page", "1");
      newSp.delete("from");
      setSp(newSp, { replace: true });
      qc.invalidateQueries({ queryKey: ["clients"] });
    }
  }, [from, sp, setSp, qc]);

  // Prepend highlighted client if not in current page
  useEffect(() => {
    if (!highlight || !data?.items) return;
    const exists = data.items.some((r) => r.id === highlight);
    if (!exists) {
      getClientById(highlight)
        .then((client) => {
          qc.setQueryData(["clients", { ...filters }], (prev: any) => {
            if (!prev) return prev;
            return { ...prev, items: [client, ...prev.items] };
          });
        })
        .catch(() => {
          // Client not found, ignore
        });
    }
  }, [highlight, data?.items?.length, filters, qc]);

  // Update URL when filters change
  const setFilters = (newFilters: Partial<ClientsFilters>) => {
    const updated = { ...filters, ...newFilters };
    // Reset to page 1 when filters change (except page itself)
    if (
      newFilters.q !== undefined ||
      newFilters.withActivePlan !== undefined ||
      newFilters.withActivePackage !== undefined ||
      newFilters.withoutPlan !== undefined ||
      newFilters.packageToRenew !== undefined ||
      newFilters.withoutAppointment !== undefined ||
      newFilters.lowActivity !== undefined ||
      newFilters.includeArchived !== undefined ||
      newFilters.lastAccessDays !== undefined ||
      newFilters.planWeeksRange !== undefined ||
      newFilters.packageStatuses !== undefined ||
      newFilters.appointmentStatuses !== undefined ||
      newFilters.activityStatuses !== undefined ||
      newFilters.sort !== undefined
    ) {
      updated.page = 1;
    }
    setFiltersState(updated);
    setSp(filtersToSearchParams(updated));
  };

  const isFormValid =
    formData.first_name.trim() !== "" &&
    formData.last_name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.fiscal_code.trim() !== "";

  const handleCreateClient = () => {
    if (!isFormValid) {
      return;
    }

    createMutation.mutate(formData, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setFormData({ first_name: "", last_name: "", email: "", phone: "", fiscal_code: "", notes: "" });
      },
    });
  };

  const handleArchive = (id: string, name: string) => {
    if (confirm(`Archiviare il cliente ${name}?`)) {
      archiveMutation.mutate(id);
    }
  };

  const handleUnarchive = (id: string, name: string) => {
    if (confirm(`Ripristinare il cliente ${name}?`)) {
      unarchiveMutation.mutate(id);
    }
  };

  const sortOptions = [
    { value: "updated_desc", label: "Modificato di recente" },
    { value: "updated_asc", label: "Meno recente" },
    { value: "name_asc", label: "Nome A-Z" },
    { value: "name_desc", label: "Nome Z-A" },
    { value: "created_desc", label: "Creato di recente" },
    { value: "created_asc", label: "Creato meno recente" },
    { value: "plan_weeks_asc", label: "Piano (recente → scaduto)" },
    { value: "plan_weeks_desc", label: "Piano (scaduto → recente)" },
    { value: "package_status", label: "Pacchetto (critico → ok)" },
    { value: "appointment_status", label: "Appuntamenti (da pianificare)" },
    { value: "activity_status", label: "Attività (inattivi → attivi)" },
  ];

  const hasActiveFilters =
    filters.withActivePlan ||
    filters.withActivePackage ||
    filters.withoutPlan ||
    filters.packageToRenew ||
    filters.withoutAppointment ||
    filters.lowActivity ||
    filters.includeArchived ||
    filters.lastAccessDays ||
    filters.planWeeksRange ||
    (filters.packageStatuses && filters.packageStatuses.length > 0) ||
    (filters.appointmentStatuses && filters.appointmentStatuses.length > 0) ||
    (filters.activityStatuses && filters.activityStatuses.length > 0);

  const clearFilters = () => {
    setFilters({
      q: "",
      withActivePlan: undefined,
      withActivePackage: undefined,
      withoutPlan: undefined,
      packageToRenew: undefined,
      withoutAppointment: undefined,
      lowActivity: undefined,
      includeArchived: undefined,
      lastAccessDays: undefined,
      planWeeksRange: undefined,
      packageStatuses: undefined,
      appointmentStatuses: undefined,
      activityStatuses: undefined,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <PageHeader
        title="Clienti"
        subtitle="Gestisci tutti i tuoi clienti in un unico posto"
        primaryCta={{
          label: "Nuovo cliente",
          onClick: () => setCreateDialogOpen(true),
          icon: <Plus className="h-4 w-4" />,
          testId: "clients-new-btn",
        }}
        toolbarLeft={
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca clienti per nome o email..."
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Escape") setFilters({ q: "" });
              }}
              className="pl-10 pr-10 h-11"
            />
            {filters.q && (
              <button
                onClick={() => setFilters({ q: "" })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        }
      />

      {/* Filters Section */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 max-w-7xl py-4 space-y-4">

          {/* Quick Filters - con scroll orizzontale smooth */}
          <div className="relative">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {/* Filtro: Piano attivo */}
              <Toggle
                pressed={filters.withActivePlan || false}
                onPressedChange={(pressed) => setFilters({ withActivePlan: pressed ? true : undefined })}
                variant="outline"
                aria-pressed={filters.withActivePlan || false}
                className={cn(
                  "rounded-full h-9 px-4 text-sm font-medium transition-all border",
                  "hover:bg-accent/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:hover:bg-primary/90"
                )}
              >
                Piano attivo
              </Toggle>

              <Toggle
                pressed={filters.withActivePackage || false}
                onPressedChange={(pressed) => setFilters({ withActivePackage: pressed ? true : undefined })}
                variant="outline"
                aria-pressed={filters.withActivePackage || false}
                className={cn(
                  "rounded-full h-9 px-4 text-sm font-medium transition-all border",
                  "hover:bg-accent/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:hover:bg-primary/90"
                )}
              >
                Pacchetto attivo
              </Toggle>

              <Toggle
                pressed={filters.withoutPlan || false}
                onPressedChange={(pressed) => setFilters({ withoutPlan: pressed ? true : undefined })}
                variant="outline"
                aria-pressed={filters.withoutPlan || false}
                className={cn(
                  "rounded-full h-9 px-4 text-sm font-medium transition-all border",
                  "hover:bg-accent/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:hover:bg-primary/90"
                )}
              >
                Senza piano
              </Toggle>

              <Toggle
                pressed={filters.packageToRenew || false}
                onPressedChange={(pressed) => setFilters({ packageToRenew: pressed ? true : undefined })}
                variant="outline"
                aria-pressed={filters.packageToRenew || false}
                className={cn(
                  "rounded-full h-9 px-4 text-sm font-medium transition-all border",
                  "hover:bg-accent/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:hover:bg-primary/90"
                )}
              >
                Pacchetto da rinnovare
              </Toggle>

              <Toggle
                pressed={filters.withoutAppointment || false}
                onPressedChange={(pressed) => setFilters({ withoutAppointment: pressed ? true : undefined })}
                variant="outline"
                aria-pressed={filters.withoutAppointment || false}
                className={cn(
                  "rounded-full h-9 px-4 text-sm font-medium transition-all border",
                  "hover:bg-accent/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:hover:bg-primary/90"
                )}
              >
                Senza appuntamento futuro
              </Toggle>

              <Toggle
                pressed={filters.lowActivity || false}
                onPressedChange={(pressed) => setFilters({ lowActivity: pressed ? true : undefined })}
                variant="outline"
                aria-pressed={filters.lowActivity || false}
                className={cn(
                  "rounded-full h-9 px-4 text-sm font-medium transition-all border",
                  "hover:bg-accent/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:hover:bg-primary/90"
                )}
              >
                Clienti non attivi
              </Toggle>

              <Toggle
                pressed={filters.includeArchived || false}
                onPressedChange={(pressed) => setFilters({ includeArchived: pressed ? true : undefined })}
                variant="outline"
                aria-pressed={filters.includeArchived || false}
                className={cn(
                  "rounded-full h-9 px-4 text-sm font-medium transition-all border",
                  "hover:bg-accent/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:hover:bg-primary/90"
                )}
              >
                Mostra archiviati
              </Toggle>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-3 text-sm ml-2">
                  <X className="h-3 w-3 mr-1" />
                  Pulisci filtri
                </Button>
              )}
            </div>
            {/* Gradient fade per indicare scroll su mobile */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
          </div>

          {/* Separatore visivo */}
          <Separator className="my-0.5" />

          {/* Advanced Filters */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 h-9"
                aria-expanded={advancedOpen}
                aria-controls="advanced-filters"
              >
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform duration-200", advancedOpen && "rotate-180")}
                />
                Filtri avanzati
              </Button>
            </CollapsibleTrigger>
          <CollapsibleContent 
            id="advanced-filters"
            className="mt-3 p-5 rounded-xl bg-muted/40 border border-muted-foreground/10 shadow-sm animate-in slide-in-from-top-2 duration-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
              {/* Filtro: Ordina per */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5 block">Ordina per</Label>
                  <Select value={filters.sort} onValueChange={(value: any) => setFilters({ sort: value })}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              {/* Filtro: Ultimo accesso */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5 block">Ultimo accesso</Label>
                  <Select
                    value={filters.lastAccessDays?.toString() || "all"}
                    onValueChange={(value) => setFilters({ lastAccessDays: value === "all" ? undefined : parseInt(value) })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Tutti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="7">Ultimi 7 giorni</SelectItem>
                      <SelectItem value="30">Ultimi 30 giorni</SelectItem>
                      <SelectItem value="90">Ultimi 90 giorni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              {/* NUOVO: Filtro Ultimo Piano (range settimane) */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5 block">Ultimo Piano</Label>
                  <Select
                    value={filters.planWeeksRange || "all"}
                    onValueChange={(value) => setFilters({ planWeeksRange: value === "all" ? undefined : value as ClientsFilters['planWeeksRange'] })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Tutti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="none">Nessun piano</SelectItem>
                      <SelectItem value="0-4">0-4 settimane</SelectItem>
                      <SelectItem value="4-8">4-8 settimane</SelectItem>
                      <SelectItem value="8+">8+ settimane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              {/* NUOVO: Filtro Pacchetto (multi-select) */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">Stato Pacchetto</Label>
                  <div className="space-y-2">
                  {[
                    { value: 'active', label: 'Attivo' },
                    { value: 'low', label: 'In esaurimento' },
                    { value: 'expired', label: 'Da rinnovare' },
                    { value: 'none', label: 'Nessuno' }
                  ].map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`package-${option.value}`}
                        checked={filters.packageStatuses?.includes(option.value as any) || false}
                        onCheckedChange={(checked) => {
                          const current = filters.packageStatuses || [];
                          const updated = checked
                            ? [...current, option.value as any]
                            : current.filter(s => s !== option.value);
                          setFilters({ packageStatuses: updated.length > 0 ? updated : undefined });
                        }}
                      />
                      <label 
                        htmlFor={`package-${option.value}`} 
                        className="text-sm cursor-pointer select-none transition-colors hover:text-foreground"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* NUOVO: Filtro Appuntamenti */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">Appuntamenti</Label>
                  <div className="space-y-2">
                  {[
                    { value: 'planned', label: 'Pianificato' },
                    { value: 'unplanned', label: 'Da pianificare' }
                  ].map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`appointment-${option.value}`}
                        checked={filters.appointmentStatuses?.includes(option.value as any) || false}
                        onCheckedChange={(checked) => {
                          const current = filters.appointmentStatuses || [];
                          const updated = checked
                            ? [...current, option.value as any]
                            : current.filter(s => s !== option.value);
                          setFilters({ appointmentStatuses: updated.length > 0 ? updated : undefined });
                        }}
                      />
                      <label 
                        htmlFor={`appointment-${option.value}`} 
                        className="text-sm cursor-pointer select-none transition-colors hover:text-foreground"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* NUOVO: Filtro Attività */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">Attività</Label>
                <div className="space-y-2">
                  {[
                    { value: 'active', label: 'Attivo' },
                    { value: 'low', label: 'Bassa' },
                    { value: 'inactive', label: 'Assente' }
                  ].map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`activity-${option.value}`}
                        checked={filters.activityStatuses?.includes(option.value as any) || false}
                        onCheckedChange={(checked) => {
                          const current = filters.activityStatuses || [];
                          const updated = checked
                            ? [...current, option.value as any]
                            : current.filter(s => s !== option.value);
                          setFilters({ activityStatuses: updated.length > 0 ? updated : undefined });
                        }}
                      />
                      <label 
                        htmlFor={`activity-${option.value}`} 
                        className="text-sm cursor-pointer select-none transition-colors hover:text-foreground"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 max-w-7xl py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-lg">
            <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? toSentenceCase("Nessun cliente trovato con questi filtri")
                : toSentenceCase("Nessun cliente ancora")}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearFilters} variant="outline" className="gap-2">
                <X className="h-4 w-4" />
                Pulisci filtri
              </Button>
            ) : (
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {toSentenceCase("Crea il tuo primo cliente")}
              </Button>
            )}
          </div>
        ) : (
          <ClientsTable
            rows={data.items}
            highlightId={highlight || undefined}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
          />
        )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{toSentenceCase("Nuovo cliente")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">{toSentenceCase("Nome")} *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder={toSentenceCase("Inserisci nome")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">{toSentenceCase("Cognome")} *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder={toSentenceCase("Inserisci cognome")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{toSentenceCase("Email")} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={toSentenceCase("Inserisci email")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{toSentenceCase("Telefono")}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={toSentenceCase("Inserisci telefono")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscal_code">{toSentenceCase("Codice fiscale")} *</Label>
              <Input
                id="fiscal_code"
                value={formData.fiscal_code}
                onChange={(e) => setFormData({ ...formData, fiscal_code: e.target.value })}
                placeholder={toSentenceCase("Inserisci codice fiscale")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{toSentenceCase("Note")}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={toSentenceCase("Note aggiuntive...")}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {toSentenceCase("Annulla")}
            </Button>
            <Button onClick={handleCreateClient} disabled={!isFormValid || createMutation.isPending}>
              {toSentenceCase("Crea cliente")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile FAB */}
      <Button
        onClick={() => setCreateDialogOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Clients;
