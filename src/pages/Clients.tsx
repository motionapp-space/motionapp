import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useTopbar } from "@/contexts/TopbarContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Plus, Search, UserPlus, ChevronDown, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toSentenceCase } from "@/lib/text";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useCreateClient } from "@/features/clients/hooks/useCreateClient";
import { useArchiveClient } from "@/features/clients/hooks/useArchiveClient";
import { useUnarchiveClient } from "@/features/clients/hooks/useUnarchiveClient";
import { useOnboardingState } from "@/features/clients/hooks/useOnboardingState";
import { ClientsEmptyOnboarding } from "@/features/clients/components/ClientsEmptyOnboarding";
import { getDefaultFilters, filtersToSearchParams } from "@/features/clients/utils/filters";
import { ClientsTable } from "@/features/clients/components/ClientsTable";
import { getClientById } from "@/features/clients/api/clients.api";
import type { ClientStatus, ClientsFilters } from "@/features/clients/types";
import { cn } from "@/lib/utils";

// Schema di validazione Zod
const clientFormSchema = z.object({
  first_name: z.string().trim().min(1, "Il nome è obbligatorio"),
  last_name: z.string().trim().min(1, "Il cognome è obbligatorio"),
  email: z.string().trim().email("Inserisci un indirizzo email valido (es. nome@dominio.com)"),
  phone: z.string().optional(),
  fiscal_code: z.string().trim().min(1, "Il codice fiscale è obbligatorio"),
  notes: z.string().optional(),
});

const Clients = () => {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const qc = useQueryClient();
  
  // Onboarding state
  const onboarding = useOnboardingState();

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Set topbar title and actions
  useTopbar({
    title: "Clienti",
    actions: (
      <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Nuovo cliente
      </Button>
    ),
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
    // Valida con Zod
    const result = clientFormSchema.safeParse(formData);
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    // Clear previous errors
    setValidationErrors({});

    // Normalizza email (lowercase + trim)
    const normalizedData = {
      ...formData,
      email: formData.email.trim().toLowerCase(),
    };

    createMutation.mutate(normalizedData, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setFormData({ first_name: "", last_name: "", email: "", phone: "", fiscal_code: "", notes: "" });
        setValidationErrors({});
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
    { value: "appointment_status", label: "Agenda (da pianificare)" },
    { value: "activity_status", label: "Attività (inattivi → attivi)" },
  ];

  const hasActiveFilters =
    filters.withoutPlan ||
    filters.packageToRenew ||
    filters.withoutAppointment ||
    filters.lowActivity ||
    filters.planWeeksRange ||
    (filters.packageStatuses && filters.packageStatuses.length > 0) ||
    (filters.appointmentStatuses && filters.appointmentStatuses.length > 0) ||
    (filters.activityStatuses && filters.activityStatuses.length > 0);

  const clearFilters = () => {
    setFilters({
      withoutPlan: undefined,
      packageToRenew: undefined,
      withoutAppointment: undefined,
      lowActivity: undefined,
      planWeeksRange: undefined,
      packageStatuses: undefined,
      appointmentStatuses: undefined,
      activityStatuses: undefined,
    });
  };

  // Loading state - mostra spinner durante calcolo stato onboarding
  if (onboarding.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // STATO 1: ZERO_CLIENTS - Nessun cliente, mostra solo empty state
  if (onboarding.state === 'ZERO_CLIENTS') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Filtro Mostra Archiviati - solo se esistono clienti archiviati */}
          {onboarding.hasArchivedClients && (
            <div className="flex items-center gap-4 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-archived-zero"
                  checked={filters.includeArchived === true}
                  onCheckedChange={(checked) => setFilters({ includeArchived: checked ? true : undefined })}
                />
                <Label htmlFor="show-archived-zero" className="cursor-pointer text-sm">
                  Mostra archiviati
                </Label>
              </div>
            </div>
          )}

          {/* Contenuto condizionale */}
          {filters.includeArchived ? (
            isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : data?.items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Nessun cliente archiviato trovato</p>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <ClientsTable
                  rows={data?.items || []}
                  highlightId={highlight || undefined}
                  onArchive={handleArchive}
                  onUnarchive={handleUnarchive}
                />
              </div>
            )
          ) : (
            <ClientsEmptyOnboarding onCreateClient={() => setCreateDialogOpen(true)} />
          )}
        </div>
        
        {/* Dialog creazione cliente */}
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
                  onChange={(e) => {
                    setFormData({ ...formData, first_name: e.target.value });
                    if (validationErrors.first_name) {
                      setValidationErrors(prev => ({ ...prev, first_name: "" }));
                    }
                  }}
                  placeholder={toSentenceCase("Inserisci nome")}
                  className={validationErrors.first_name ? "border-destructive" : ""}
                />
                {validationErrors.first_name && (
                  <p className="text-sm text-destructive">{validationErrors.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">{toSentenceCase("Cognome")} *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => {
                    setFormData({ ...formData, last_name: e.target.value });
                    if (validationErrors.last_name) {
                      setValidationErrors(prev => ({ ...prev, last_name: "" }));
                    }
                  }}
                  placeholder={toSentenceCase("Inserisci cognome")}
                  className={validationErrors.last_name ? "border-destructive" : ""}
                />
                {validationErrors.last_name && (
                  <p className="text-sm text-destructive">{validationErrors.last_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{toSentenceCase("Email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: "" }));
                    }
                  }}
                  placeholder={toSentenceCase("Inserisci email")}
                  className={validationErrors.email ? "border-destructive" : ""}
                />
                {validationErrors.email && (
                  <p className="text-sm text-destructive">{validationErrors.email}</p>
                )}
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
                  onChange={(e) => {
                    setFormData({ ...formData, fiscal_code: e.target.value });
                    if (validationErrors.fiscal_code) {
                      setValidationErrors(prev => ({ ...prev, fiscal_code: "" }));
                    }
                  }}
                  placeholder={toSentenceCase("Inserisci codice fiscale")}
                  className={validationErrors.fiscal_code ? "border-destructive" : ""}
                />
                {validationErrors.fiscal_code && (
                  <p className="text-sm text-destructive">{validationErrors.fiscal_code}</p>
                )}
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
      </div>
    );
  }

  // STATO 2: FIRST_CLIENT_NO_CONTENT - Primo cliente creato ma senza contenuti
  if (onboarding.state === 'FIRST_CLIENT_NO_CONTENT') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="container mx-auto px-6 max-w-7xl pt-6">
          {/* Toolbar */}
          <div className="mb-6 space-y-4">
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
          </div>
        </div>

        <div className="container mx-auto px-6 py-6 max-w-7xl">
          {/* Tabella base senza filtri */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : data?.items.length === 0 && filters.includeArchived ? (
            <div className="flex items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Nessun cliente archiviato trovato</p>
            </div>
          ) : (
            <ClientsTable
              rows={data?.items || []}
              highlightId={highlight || undefined}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
            />
          )}
        </div>

        {/* Dialog creazione cliente */}
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
                  onChange={(e) => {
                    setFormData({ ...formData, first_name: e.target.value });
                    if (validationErrors.first_name) {
                      setValidationErrors(prev => ({ ...prev, first_name: "" }));
                    }
                  }}
                  placeholder={toSentenceCase("Inserisci nome")}
                  className={validationErrors.first_name ? "border-destructive" : ""}
                />
                {validationErrors.first_name && (
                  <p className="text-sm text-destructive">{validationErrors.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">{toSentenceCase("Cognome")} *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => {
                    setFormData({ ...formData, last_name: e.target.value });
                    if (validationErrors.last_name) {
                      setValidationErrors(prev => ({ ...prev, last_name: "" }));
                    }
                  }}
                  placeholder={toSentenceCase("Inserisci cognome")}
                  className={validationErrors.last_name ? "border-destructive" : ""}
                />
                {validationErrors.last_name && (
                  <p className="text-sm text-destructive">{validationErrors.last_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{toSentenceCase("Email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: "" }));
                    }
                  }}
                  placeholder={toSentenceCase("Inserisci email")}
                  className={validationErrors.email ? "border-destructive" : ""}
                />
                {validationErrors.email && (
                  <p className="text-sm text-destructive">{validationErrors.email}</p>
                )}
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
                  onChange={(e) => {
                    setFormData({ ...formData, fiscal_code: e.target.value });
                    if (validationErrors.fiscal_code) {
                      setValidationErrors(prev => ({ ...prev, fiscal_code: "" }));
                    }
                  }}
                  placeholder={toSentenceCase("Inserisci codice fiscale")}
                  className={validationErrors.fiscal_code ? "border-destructive" : ""}
                />
                {validationErrors.fiscal_code && (
                  <p className="text-sm text-destructive">{validationErrors.fiscal_code}</p>
                )}
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
  }

  // STATO 3: ACTIVE_USER - Vista completa con tutti i filtri (codice esistente)
  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      {/* Toolbar section */}
      <div className="container mx-auto px-6 max-w-7xl pt-6">
        <div className="mb-6 space-y-4">
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
        </div>
      </div>

      {/* Filters Section */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 max-w-7xl py-4 space-y-3">

          {/* Quick Filters Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Toggle
              pressed={filters.withoutPlan || false}
              onPressedChange={(pressed) => setFilters({ withoutPlan: pressed ? true : undefined })}
              variant="outline"
              size="sm"
              className="h-9"
            >
              Senza piano
            </Toggle>
            
            <Toggle
              pressed={filters.packageToRenew || false}
              onPressedChange={(pressed) => setFilters({ packageToRenew: pressed ? true : undefined })}
              variant="outline"
              size="sm"
              className="h-9"
            >
              Pacchetto da rinnovare
            </Toggle>
            
            <Toggle
              pressed={filters.withoutAppointment || false}
              onPressedChange={(pressed) => setFilters({ withoutAppointment: pressed ? true : undefined })}
              variant="outline"
              size="sm"
              className="h-9"
            >
              Senza appuntamento futuro
            </Toggle>

            <Toggle
              pressed={filters.lowActivity || false}
              onPressedChange={(pressed) => setFilters({ lowActivity: pressed ? true : undefined })}
              variant="outline"
              size="sm"
              className="h-9"
            >
              Clienti non attivi
            </Toggle>
          </div>

          {/* Control Bar: Sort + Show Archived + Advanced Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Ordina per:</span>
              <Select value={filters.sort} onValueChange={(value: any) => setFilters({ sort: value })}>
                <SelectTrigger className="h-9 w-[200px]">
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

              <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-9 px-3 transition-colors",
                      advancedOpen
                        ? "bg-green-600 text-white hover:bg-green-700 hover:text-white"
                        : "text-muted-foreground hover:bg-green-600 hover:text-white"
                    )}
                  >
                    Filtri avanzati
                    <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" align="start">
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left Column: Relazione / Attività */}
                      <div className="space-y-5">
                        {/* Agenda */}
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">
                            Agenda
                          </Label>
                          <RadioGroup
                            value={
                              !filters.appointmentStatuses || filters.appointmentStatuses.length === 0
                                ? "all"
                                : filters.appointmentStatuses.includes("planned") && filters.appointmentStatuses.includes("unplanned")
                                ? "all"
                                : filters.appointmentStatuses[0]
                            }
                            onValueChange={(value) => {
                              if (value === "all") {
                                setFilters({ appointmentStatuses: undefined });
                              } else {
                                setFilters({ appointmentStatuses: [value as any] });
                              }
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="all" id="appointment-all" />
                              <Label htmlFor="appointment-all" className="cursor-pointer font-normal">Tutti</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="planned" id="appointment-planned" />
                              <Label htmlFor="appointment-planned" className="cursor-pointer font-normal">Pianificato</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="unplanned" id="appointment-unplanned" />
                              <Label htmlFor="appointment-unplanned" className="cursor-pointer font-normal">Da pianificare</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Attività */}
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">
                            Attività
                          </Label>
                          <RadioGroup
                            value={
                              !filters.activityStatuses || filters.activityStatuses.length === 0
                                ? "all"
                                : filters.activityStatuses.includes("active") && filters.activityStatuses.includes("low") && filters.activityStatuses.includes("inactive")
                                ? "all"
                                : filters.activityStatuses[0]
                            }
                            onValueChange={(value) => {
                              if (value === "all") {
                                setFilters({ activityStatuses: undefined });
                              } else {
                                setFilters({ activityStatuses: [value as any] });
                              }
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="all" id="activity-all" />
                              <Label htmlFor="activity-all" className="cursor-pointer font-normal">Tutti</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="active" id="activity-active" />
                              <Label htmlFor="activity-active" className="cursor-pointer font-normal">Attivo</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="low" id="activity-low" />
                              <Label htmlFor="activity-low" className="cursor-pointer font-normal">Bassa</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="inactive" id="activity-inactive" />
                              <Label htmlFor="activity-inactive" className="cursor-pointer font-normal">Assente</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>

                      {/* Right Column: Piano & Pacchetto */}
                      <div className="space-y-5">
                        {/* Ultimo piano */}
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">
                            Ultimo Piano
                          </Label>
                          <RadioGroup
                            value={filters.planWeeksRange || "all"}
                            onValueChange={(value) => setFilters({ planWeeksRange: value === "all" ? undefined : value as ClientsFilters['planWeeksRange'] })}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="all" id="plan-all" />
                              <Label htmlFor="plan-all" className="cursor-pointer font-normal">Tutti</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="0-4" id="plan-0-4" />
                              <Label htmlFor="plan-0-4" className="cursor-pointer font-normal">0–4 settimane</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="4-8" id="plan-4-8" />
                              <Label htmlFor="plan-4-8" className="cursor-pointer font-normal">4–8 settimane</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="8+" id="plan-8plus" />
                              <Label htmlFor="plan-8plus" className="cursor-pointer font-normal">8+ settimane</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="none" id="plan-none" />
                              <Label htmlFor="plan-none" className="cursor-pointer font-normal">Nessun piano</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Stato pacchetto */}
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">
                            Stato Pacchetto
                          </Label>
                          <RadioGroup
                            value={
                              !filters.packageStatuses || filters.packageStatuses.length === 0
                                ? "all"
                                : filters.packageStatuses.length > 1
                                ? "all"
                                : filters.packageStatuses[0]
                            }
                            onValueChange={(value) => {
                              if (value === "all") {
                                setFilters({ packageStatuses: undefined });
                              } else {
                                setFilters({ packageStatuses: [value as any] });
                              }
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="all" id="package-all" />
                              <Label htmlFor="package-all" className="cursor-pointer font-normal">Tutti</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="active" id="package-active" />
                              <Label htmlFor="package-active" className="cursor-pointer font-normal">Attivo</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="low" id="package-low" />
                              <Label htmlFor="package-low" className="cursor-pointer font-normal">In esaurimento</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="expired" id="package-expired" />
                              <Label htmlFor="package-expired" className="cursor-pointer font-normal">Da rinnovare</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="none" id="package-none" />
                              <Label htmlFor="package-none" className="cursor-pointer font-normal">Nessuno</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilters({
                            appointmentStatuses: undefined,
                            activityStatuses: undefined,
                            planWeeksRange: undefined,
                            packageStatuses: undefined,
                          });
                        }}
                      >
                        Reimposta
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setAdvancedOpen(false)}
                      >
                        Applica filtri
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {onboarding.hasArchivedClients && (
              <div className="flex items-center gap-2">
                <Switch
                  id="show-archived"
                  checked={filters.includeArchived === true}
                  onCheckedChange={(checked) => setFilters({ includeArchived: checked ? true : undefined })}
                />
                <Label htmlFor="show-archived" className="cursor-pointer text-sm">
                  Mostra archiviati
                </Label>
              </div>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Filtri attivi:</span>
              
              {filters.withoutPlan && (
                <Badge variant="secondary" className="gap-1">
                  Senza piano
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ withoutPlan: undefined })}
                  />
                </Badge>
              )}

              {filters.packageToRenew && (
                <Badge variant="secondary" className="gap-1">
                  Pacchetto da rinnovare
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ packageToRenew: undefined })}
                  />
                </Badge>
              )}

              {filters.withoutAppointment && (
                <Badge variant="secondary" className="gap-1">
                  Senza appuntamento futuro
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ withoutAppointment: undefined })}
                  />
                </Badge>
              )}

              {filters.lowActivity && (
                <Badge variant="secondary" className="gap-1">
                  Clienti non attivi
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ lowActivity: undefined })}
                  />
                </Badge>
              )}

              {filters.planWeeksRange && (
                <Badge variant="secondary" className="gap-1">
                  Piano: {
                    filters.planWeeksRange === "none" ? "Nessun piano" :
                    filters.planWeeksRange === "0-4" ? "0-4 sett" :
                    filters.planWeeksRange === "4-8" ? "4-8 sett" :
                    "8+ sett"
                  }
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ planWeeksRange: undefined })}
                  />
                </Badge>
              )}

              {filters.packageStatuses && filters.packageStatuses.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Pacchetto: {
                    filters.packageStatuses[0] === "active" ? "Attivo" :
                    filters.packageStatuses[0] === "low" ? "In esaurimento" :
                    filters.packageStatuses[0] === "expired" ? "Da rinnovare" :
                    "Nessuno"
                  }
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ packageStatuses: undefined })}
                  />
                </Badge>
              )}

              {filters.appointmentStatuses && filters.appointmentStatuses.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Agenda: {
                    filters.appointmentStatuses[0] === "planned" ? "Pianificato" : "Da pianificare"
                  }
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ appointmentStatuses: undefined })}
                  />
                </Badge>
              )}

              {filters.activityStatuses && filters.activityStatuses.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Attività: {
                    filters.activityStatuses[0] === "active" ? "Attivo" :
                    filters.activityStatuses[0] === "low" ? "Bassa" :
                    "Assente"
                  }
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ activityStatuses: undefined })}
                  />
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={clearFilters}
              >
                Pulisci tutti
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 max-w-7xl py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                onChange={(e) => {
                  setFormData({ ...formData, first_name: e.target.value });
                  if (validationErrors.first_name) {
                    setValidationErrors(prev => ({ ...prev, first_name: "" }));
                  }
                }}
                placeholder={toSentenceCase("Inserisci nome")}
                className={validationErrors.first_name ? "border-destructive" : ""}
              />
              {validationErrors.first_name && (
                <p className="text-sm text-destructive">{validationErrors.first_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">{toSentenceCase("Cognome")} *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => {
                  setFormData({ ...formData, last_name: e.target.value });
                  if (validationErrors.last_name) {
                    setValidationErrors(prev => ({ ...prev, last_name: "" }));
                  }
                }}
                placeholder={toSentenceCase("Inserisci cognome")}
                className={validationErrors.last_name ? "border-destructive" : ""}
              />
              {validationErrors.last_name && (
                <p className="text-sm text-destructive">{validationErrors.last_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{toSentenceCase("Email")} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (validationErrors.email) {
                    setValidationErrors(prev => ({ ...prev, email: "" }));
                  }
                }}
                placeholder={toSentenceCase("Inserisci email")}
                className={validationErrors.email ? "border-destructive" : ""}
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive">{validationErrors.email}</p>
              )}
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
                onChange={(e) => {
                  setFormData({ ...formData, fiscal_code: e.target.value });
                  if (validationErrors.fiscal_code) {
                    setValidationErrors(prev => ({ ...prev, fiscal_code: "" }));
                  }
                }}
                placeholder={toSentenceCase("Inserisci codice fiscale")}
                className={validationErrors.fiscal_code ? "border-destructive" : ""}
              />
              {validationErrors.fiscal_code && (
                <p className="text-sm text-destructive">{validationErrors.fiscal_code}</p>
              )}
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
