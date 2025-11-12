import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
      newFilters.status !== undefined ||
      newFilters.withActivePlan !== undefined ||
      newFilters.withActivePackage !== undefined ||
      newFilters.lastAccessDays !== undefined ||
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
  ];

  const hasActiveFilters =
    filters.withActivePlan ||
    filters.withActivePackage ||
    (filters.status && filters.status.length > 0 && filters.status.length < 3) ||
    filters.lastAccessDays;

  const clearFilters = () => {
    setFilters({
      q: "",
      status: ["ATTIVO", "POTENZIALE", "INATTIVO"],
      withActivePlan: undefined,
      withActivePackage: undefined,
      lastAccessDays: undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{toSentenceCase("Clienti")}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {toSentenceCase("Gestisci tutti i tuoi clienti in un unico posto")}
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2" data-testid="clients-new-btn">
              <Plus className="h-4 w-4" />
              {toSentenceCase("Nuovo cliente")}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={toSentenceCase("Cerca clienti per nome o email...")}
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="pl-10 pr-10 h-11"
            />
            {filters.q && (
              <button
                onClick={() => setFilters({ q: "" })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Filtri rapidi:</span>
            
            <Toggle
              pressed={filters.withActivePlan || false}
              onPressedChange={(pressed) => setFilters({ withActivePlan: pressed ? true : undefined })}
              variant="outline"
              className={cn(
                "rounded-full h-9 px-4 text-sm transition-all",
                "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
              )}
            >
              Piano attivo
            </Toggle>

            <Toggle
              pressed={filters.withActivePackage || false}
              onPressedChange={(pressed) => setFilters({ withActivePackage: pressed ? true : undefined })}
              variant="outline"
              className={cn(
                "rounded-full h-9 px-4 text-sm transition-all",
                "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
              )}
            >
              Pacchetto attivo
            </Toggle>

            <Toggle
              pressed={filters.status?.includes("ATTIVO") && filters.status.length === 1}
              onPressedChange={(pressed) =>
                setFilters({ status: pressed ? ["ATTIVO"] : ["ATTIVO", "POTENZIALE", "INATTIVO"] })
              }
              variant="outline"
              className={cn(
                "rounded-full h-9 px-4 text-sm transition-all",
                "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
              )}
            >
              Attivi
            </Toggle>

            <Toggle
              pressed={filters.status?.includes("POTENZIALE") && filters.status.length === 1}
              onPressedChange={(pressed) =>
                setFilters({ status: pressed ? ["POTENZIALE"] : ["ATTIVO", "POTENZIALE", "INATTIVO"] })
              }
              variant="outline"
              className={cn(
                "rounded-full h-9 px-4 text-sm transition-all",
                "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
              )}
            >
              Potenziali
            </Toggle>

            <Toggle
              pressed={filters.status?.includes("ARCHIVIATO") && filters.status.length === 1}
              onPressedChange={(pressed) =>
                setFilters({ status: pressed ? ["ARCHIVIATO"] : ["ATTIVO", "POTENZIALE", "INATTIVO"] })
              }
              variant="outline"
              className={cn(
                "rounded-full h-9 px-4 text-sm transition-all",
                "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
              )}
            >
              Archiviati
            </Toggle>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-3 text-sm">
                <X className="h-3 w-3 mr-1" />
                Pulisci filtri
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")}
                />
                Filtri avanzati
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 p-4 rounded-lg border bg-muted/30 animate-accordion-down">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-2 block">Ordina per</Label>
                  <Select value={filters.sort} onValueChange={(value: any) => setFilters({ sort: value })}>
                    <SelectTrigger className="h-9">
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

                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-2 block">Ultimo accesso</Label>
                  <Select
                    value={filters.lastAccessDays?.toString() || "all"}
                    onValueChange={(value) => setFilters({ lastAccessDays: value === "all" ? undefined : parseInt(value) })}
                  >
                    <SelectTrigger className="h-9">
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
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
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
