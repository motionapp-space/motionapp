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
  const [customDuration, setCustomDuration] = useState<boolean>(false);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreatePackageInput>({
    defaultValues: {
      client_id: clientId,
      total_sessions: 10,
      name: suggestPackageName(10),
      duration_months: 6,
    },
  });

  const priceValue = watch("price_total_cents");
  const durationValue = watch("duration_months");

  // Update default price and duration when sessions change
  useEffect(() => {
    if (settings) {
      // Set default price if not custom
      if (!customPrice) {
        const priceKey = `sessions_${selectedSessions}_price` as keyof typeof settings;
        const defaultPrice = settings[priceKey] as number;
        setValue("price_total_cents", defaultPrice);
      }
      
      // Set default duration if not custom
      if (!customDuration) {
        const durationKey = `sessions_${selectedSessions}_duration` as keyof typeof settings;
        const defaultDuration = settings[durationKey] as number;
        setValue("duration_months", defaultDuration);
      }
    }
  }, [selectedSessions, settings, customPrice, customDuration, setValue]);

  const handleSessionsChange = (value: string) => {
    const sessions = parseInt(value);
    setSelectedSessions(sessions);
    setValue("total_sessions", sessions);
    setValue("name", suggestPackageName(sessions));
    setCustomPrice(false); // Reset custom price flag
    setCustomDuration(false); // Reset custom duration flag
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cents = Math.round(parseFloat(e.target.value || "0") * 100);
    setValue("price_total_cents", cents);
    setCustomPrice(true);
  };

  const handleDurationChange = (value: string) => {
    setValue("duration_months", parseInt(value));
    setCustomDuration(true);
  };

  const onSubmitForm = (data: CreatePackageInput) => {
    // Clean up empty strings to null for optional fields
    const cleanedData = {
      ...data,
      expires_at: data.expires_at && data.expires_at.trim() !== '' ? data.expires_at : null,
      payment_method: data.payment_method && data.payment_method.trim() !== '' ? data.payment_method : null,
      notes_internal: data.notes_internal && data.notes_internal.trim() !== '' ? data.notes_internal : null,
    };
    onSubmit(cleanedData);
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
            <Label htmlFor="duration_months">Durata</Label>
            <Select
              value={durationValue?.toString() || "3"}
              onValueChange={handleDurationChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mese</SelectItem>
                <SelectItem value="3">3 mesi</SelectItem>
                <SelectItem value="6">6 mesi</SelectItem>
                <SelectItem value="12">12 mesi</SelectItem>
              </SelectContent>
            </Select>
            {customDuration && (
              <p className="text-xs text-muted-foreground">
                Durata personalizzata
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Il pacchetto scadrà {durationValue} {durationValue === 1 ? 'mese' : 'mesi'} dopo la creazione
            </p>
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
