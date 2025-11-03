import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreatePackageInput } from "../types";
import { formatCurrency, suggestPackageName } from "../utils/kpi";
import { usePackageSettings } from "../hooks/usePackageSettings";

interface PackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSubmit: (data: CreatePackageInput) => void;
  isLoading?: boolean;
}

export function PackageDialog({
  open,
  onOpenChange,
  clientId,
  onSubmit,
  isLoading,
}: PackageDialogProps) {
  const { data: settings } = usePackageSettings();
  const [selectedSessions, setSelectedSessions] = useState<number>(10);
  const [customPrice, setCustomPrice] = useState<boolean>(false);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreatePackageInput>({
    defaultValues: {
      client_id: clientId,
      total_sessions: 10,
      name: suggestPackageName(10),
    },
  });

  const priceValue = watch("price_total_cents");

  // Update default price when sessions change
  useEffect(() => {
    if (settings && !customPrice) {
      const priceKey = `sessions_${selectedSessions}_price` as keyof typeof settings;
      const defaultPrice = settings[priceKey] as number;
      setValue("price_total_cents", defaultPrice);
    }
  }, [selectedSessions, settings, customPrice, setValue]);

  const handleSessionsChange = (value: string) => {
    const sessions = parseInt(value);
    setSelectedSessions(sessions);
    setValue("total_sessions", sessions);
    setValue("name", suggestPackageName(sessions));
    setCustomPrice(false); // Reset custom price flag
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cents = Math.round(parseFloat(e.target.value || "0") * 100);
    setValue("price_total_cents", cents);
    setCustomPrice(true);
  };

  const onSubmitForm = (data: CreatePackageInput) => {
    onSubmit(data);
    reset();
    setCustomPrice(false);
  };

  const pricePerSession = priceValue && selectedSessions 
    ? formatCurrency(priceValue / selectedSessions) 
    : "N/D";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuovo pacchetto sessioni</DialogTitle>
          <DialogDescription>
            Crea un nuovo pacchetto di sessioni per il cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="total_sessions">Numero di sessioni *</Label>
            <Select
              value={selectedSessions.toString()}
              onValueChange={handleSessionsChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 sessione</SelectItem>
                <SelectItem value="5">5 sessioni</SelectItem>
                <SelectItem value="10">10 sessioni</SelectItem>
                <SelectItem value="20">20 sessioni</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome pacchetto *</Label>
            <Input
              id="name"
              {...register("name", { 
                required: "Nome richiesto",
                minLength: { value: 3, message: "Minimo 3 caratteri" },
                maxLength: { value: 80, message: "Massimo 80 caratteri" },
              })}
              placeholder="Es. 10 lezioni individuali"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Prezzo totale (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={priceValue ? (priceValue / 100).toFixed(2) : ""}
                onChange={handlePriceChange}
                placeholder="0.00"
              />
              {customPrice && (
                <p className="text-xs text-muted-foreground">
                  Prezzo personalizzato
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Prezzo unitario</Label>
              <Input value={pricePerSession} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_at">Scadenza (opzionale)</Label>
            <Input
              id="expires_at"
              type="date"
              {...register("expires_at")}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Metodo di pagamento</Label>
            <Input
              id="payment_method"
              {...register("payment_method")}
              placeholder="Es. Contanti, Bonifico, Carta"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes_internal">Note interne</Label>
            <Textarea
              id="notes_internal"
              {...register("notes_internal")}
              placeholder="Note visibili solo a te"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creazione..." : "Crea pacchetto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
