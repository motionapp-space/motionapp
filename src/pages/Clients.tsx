import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClientStore } from "@/stores/useClientStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Edit, Archive, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toSentenceCase } from "@/lib/text";
import { toast } from "sonner";
import type { ClientStatus } from "@/types/client";

const Clients = () => {
  const navigate = useNavigate();
  const {
    clients,
    filters,
    isLoading,
    isSaving,
    loadClients,
    setFilters,
    createClient,
    archiveClient,
  } = useClientStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleCreateClient = async () => {
    if (!formData.first_name || !formData.last_name) {
      toast.error("Nome e cognome sono obbligatori");
      return;
    }

    const clientId = await createClient(formData);
    if (clientId) {
      setCreateDialogOpen(false);
      setFormData({ first_name: "", last_name: "", email: "", phone: "", notes: "" });
      navigate(`/clients/${clientId}`);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Archiviare il cliente ${name}?`)) {
      await archiveClient(id);
    }
  };

  const statusOptions: { value: ClientStatus | "ALL"; label: string }[] = [
    { value: "ALL", label: "Tutti gli stati" },
    { value: "POTENZIALE", label: "Potenziale" },
    { value: "ATTIVO", label: "Attivo" },
    { value: "SOSPESO", label: "Sospeso" },
    { value: "ARCHIVIATO", label: "Archiviato" },
  ];

  const sortOptions = [
    { value: "updated_desc", label: "Modificato di recente" },
    { value: "updated_asc", label: "Meno recente" },
    { value: "name_asc", label: "Nome A-Z" },
    { value: "name_desc", label: "Nome Z-A" },
    { value: "created_desc", label: "Creato di recente" },
    { value: "created_asc", label: "Creato meno recente" },
  ];

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case "ATTIVO": return "bg-green-100 text-green-800";
      case "POTENZIALE": return "bg-blue-100 text-blue-800";
      case "SOSPESO": return "bg-yellow-100 text-yellow-800";
      case "ARCHIVIATO": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-h4 font-semibold">{toSentenceCase("Clienti")}</h1>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 h-11">
              <Plus className="h-4 w-4" />
              {toSentenceCase("Nuovo cliente")}
            </Button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={toSentenceCase("Cerca clienti...")}
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="pl-10 h-11"
              />
            </div>
            <Select
              value={filters.status || "ALL"}
              onValueChange={(value) => setFilters({ status: value === "ALL" ? undefined : value as ClientStatus })}
            >
              <SelectTrigger className="w-full md:w-[200px] h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.sortBy} onValueChange={(value: any) => setFilters({ sortBy: value })}>
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
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-lg">
            <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {filters.search || filters.status
                ? toSentenceCase("Nessun cliente trovato con questi filtri")
                : toSentenceCase("Nessun cliente ancora")}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {toSentenceCase("Crea il tuo primo cliente")}
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{toSentenceCase("Nome")}</TableHead>
                  <TableHead>{toSentenceCase("Email")}</TableHead>
                  <TableHead>{toSentenceCase("Telefono")}</TableHead>
                  <TableHead>{toSentenceCase("Stato")}</TableHead>
                  <TableHead>{toSentenceCase("Tags")}</TableHead>
                  <TableHead className="text-right">{toSentenceCase("Azioni")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.last_name} {client.first_name}
                    </TableCell>
                    <TableCell>{client.email || "-"}</TableCell>
                    <TableCell>{client.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(client.status)} variant="secondary">
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {client.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color }}>
                            {tag.label}
                          </Badge>
                        ))}
                        {(client.tags?.length || 0) > 2 && (
                          <Badge variant="outline">+{(client.tags?.length || 0) - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(client.id, `${client.first_name} ${client.last_name}`)}
                          disabled={client.status === "ARCHIVIATO"}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
              <Label htmlFor="email">{toSentenceCase("Email")}</Label>
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
            <Button onClick={handleCreateClient} disabled={isSaving}>
              {toSentenceCase("Crea cliente")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
