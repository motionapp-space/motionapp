import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Search, UserPlus, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toSentenceCase } from "@/lib/text";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useCreateClient } from "@/features/clients/hooks/useCreateClient";
import { useArchiveClient } from "@/features/clients/hooks/useArchiveClient";
import { useUnarchiveClient } from "@/features/clients/hooks/useUnarchiveClient";
import { getDefaultFilters, filtersToSearchParams } from "@/features/clients/utils/filters";
import { statusLabel, encodeStatus, decodeStatus } from "@/features/clients/utils/status-utils";
import { ClientsTable } from "@/features/clients/components/ClientsTable";
import { getClientById } from "@/features/clients/api/clients.api";
import type { ClientStatus, ClientsFilters } from "@/features/clients/types";

const Clients = () => {
  const [sp, setSp] = useSearchParams();
  const qc = useQueryClient();

  const highlight = sp.get("highlight");
  const from = sp.get("from");

  const [filters, setFiltersState] = useState<ClientsFilters>(getDefaultFilters(sp));
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
      newFilters.tag !== undefined ||
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

  const currentStatusLabel = "Tutti";

  const statusOptions: { value: string; label: string }[] = [
    { value: "all", label: "Tutti (non archiviati)" },
  ];

  const sortOptions = [
    { value: "updated_desc", label: "Modificato di recente" },
    { value: "updated_asc", label: "Meno recente" },
    { value: "name_asc", label: "Nome A-Z" },
    { value: "name_desc", label: "Nome Z-A" },
    { value: "created_desc", label: "Creato di recente" },
    { value: "created_asc", label: "Creato meno recente" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={toSentenceCase("Clienti")}
        subtitle={toSentenceCase("Gestisci tutti i tuoi clienti in un unico posto")}
        primaryCta={{
          label: toSentenceCase("Nuovo cliente"),
          onClick: () => setCreateDialogOpen(true),
          icon: <Plus className="h-4 w-4" />,
          testId: "clients-new-btn",
        }}
        toolbarLeft={
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={toSentenceCase("Cerca clienti...")}
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="pl-10 h-11"
            />
          </div>
        }
        toolbarRight={
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="withActivePlan"
                  checked={filters.withActivePlan || false}
                  onCheckedChange={(checked) => setFilters({ withActivePlan: checked === true ? true : undefined })}
                />
                <Label htmlFor="withActivePlan" className="text-sm cursor-pointer">
                  Con piano attivo
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="withActivePackage"
                  checked={filters.withActivePackage || false}
                  onCheckedChange={(checked) => setFilters({ withActivePackage: checked === true ? true : undefined })}
                />
                <Label htmlFor="withActivePackage" className="text-sm cursor-pointer">
                  Con pacchetto attivo
                </Label>
              </div>
              <Select
                value={filters.lastAccessDays?.toString() || "all"}
                onValueChange={(value) => setFilters({ lastAccessDays: value === "all" ? undefined : parseInt(value) })}
              >
                <SelectTrigger className="w-[160px] h-11">
                  <SelectValue placeholder="Ultimo accesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="7">Ultimi 7 giorni</SelectItem>
                  <SelectItem value="30">Ultimi 30 giorni</SelectItem>
                  <SelectItem value="90">Ultimi 90 giorni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Select
                value="all"
                onValueChange={() => {}}
              >
                <SelectTrigger className="w-full md:w-[200px] h-11">
                  <span className="truncate">{currentStatusLabel}</span>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.sort} onValueChange={(value: any) => setFilters({ sort: value })}>
                <SelectTrigger className="w-full md:w-[200px] h-11">
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
          </div>
        }
      />

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pb-6 md:pb-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-lg">
            <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {filters.q
                ? toSentenceCase("Nessun cliente trovato con questi filtri")
                : toSentenceCase("Nessun cliente ancora")}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {toSentenceCase("Crea il tuo primo cliente")}
            </Button>
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
    </div>
  );
};

export default Clients;
