import { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { PriceInput } from "@/components/ui/price-input";
import type { Product, CreateProductInput, UpdateProductInput } from "../types";
import { formatCurrency } from "@/features/packages/utils/kpi";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  singleSessionPrice: number;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => void;
  isLoading?: boolean;
}

interface FormValues {
  name: string;
  credits_amount: number;
  price_cents: number;
  duration_months: number;
  description: string;
  is_active: boolean;
  is_visible: boolean;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  singleSessionPrice,
  onSubmit,
  isLoading,
}: ProductFormDialogProps) {
  const isEditing = !!product;

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      name: "",
      credits_amount: 5,
      price_cents: singleSessionPrice * 5,
      duration_months: 3,
      description: "",
      is_active: true,
      is_visible: true,
    },
  });

  // Reset form when dialog opens or product changes
  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          name: product.name,
          credits_amount: product.credits_amount,
          price_cents: product.price_cents,
          duration_months: product.duration_months,
          description: product.description || "",
          is_active: product.is_active,
          is_visible: product.is_visible,
        });
      } else {
        reset({
          name: "Pacchetto 5 sessioni",
          credits_amount: 5,
          price_cents: Math.round(singleSessionPrice * 5 * 0.9), // 10% discount default
          duration_months: 3,
          description: "",
          is_active: true,
          is_visible: true,
        });
      }
    }
  }, [open, product, singleSessionPrice, reset]);

  const creditsAmount = watch("credits_amount");
  const priceCents = watch("price_cents");
  const isActive = watch("is_active");
  const isVisible = watch("is_visible");

  // Calculate discount and price per session
  const pricePerSession = creditsAmount > 0 ? priceCents / creditsAmount : 0;
  const expectedPrice = singleSessionPrice * creditsAmount;
  const discountPercent = expectedPrice > 0 
    ? Math.round(((expectedPrice - priceCents) / expectedPrice) * 100) 
    : 0;

  // Smart defaults when credits change (only for new products)
  const handleCreditsChange = (value: string) => {
    const credits = parseInt(value) || 1;
    setValue("credits_amount", credits);
    
    if (!isEditing) {
      // Suggest name
      setValue("name", `Pacchetto ${credits} sessioni`);
      
      // Suggest price with progressive discount
      const baseDiscount = Math.min(5 + (credits - 1) * 2, 30); // 5% to 30%
      const suggestedPrice = Math.round(singleSessionPrice * credits * (1 - baseDiscount / 100));
      setValue("price_cents", suggestedPrice);
      
      // Suggest duration (roughly 1 month per 2-3 sessions)
      const suggestedDuration = Math.max(1, Math.ceil(credits / 3));
      setValue("duration_months", Math.min(suggestedDuration, 12));
    }
  };

  const onSubmitForm = (data: FormValues) => {
    const payload: CreateProductInput | UpdateProductInput = {
      name: data.name,
      credits_amount: data.credits_amount,
      price_cents: data.price_cents,
      duration_months: data.duration_months,
      description: data.description || null,
      is_active: data.is_active,
      is_visible: data.is_visible,
      type: "session_pack",
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifica pacchetto" : "Nuovo pacchetto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifica le informazioni del pacchetto sessioni."
              : "Crea un nuovo pacchetto sessioni per i tuoi clienti."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Credits Amount */}
          <div className="space-y-2">
            <Label htmlFor="credits_amount">Numero di sessioni *</Label>
            <Input
              id="credits_amount"
              type="number"
              min="1"
              max="100"
              value={creditsAmount}
              onChange={(e) => handleCreditsChange(e.target.value)}
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome pacchetto *</Label>
            <Input
              id="name"
              {...register("name", { 
                required: "Nome richiesto",
                minLength: { value: 3, message: "Minimo 3 caratteri" },
                maxLength: { value: 80, message: "Massimo 80 caratteri" },
              })}
              placeholder="Es. Pacchetto 10 sessioni"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label>Prezzo totale (€) *</Label>
            <PriceInput
              value={priceCents}
              onChange={(cents) => setValue("price_cents", cents)}
            />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{formatCurrency(pricePerSession)}/sessione</span>
              {discountPercent > 0 && (
                <span className="text-primary font-medium">
                  -{discountPercent}% rispetto a singola
                </span>
              )}
              {discountPercent < 0 && (
                <span className="text-destructive font-medium">
                  +{Math.abs(discountPercent)}% rispetto a singola
                </span>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration_months">Durata validità</Label>
            <Select
              value={watch("duration_months").toString()}
              onValueChange={(v) => setValue("duration_months", parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mese</SelectItem>
                <SelectItem value="2">2 mesi</SelectItem>
                <SelectItem value="3">3 mesi</SelectItem>
                <SelectItem value="4">4 mesi</SelectItem>
                <SelectItem value="5">5 mesi</SelectItem>
                <SelectItem value="6">6 mesi</SelectItem>
                <SelectItem value="9">9 mesi</SelectItem>
                <SelectItem value="12">12 mesi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione (opzionale)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Note o descrizione del pacchetto"
              rows={2}
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setValue("is_active", checked)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Attivo
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_visible"
                checked={isVisible}
                onCheckedChange={(checked) => setValue("is_visible", checked)}
              />
              <Label htmlFor="is_visible" className="cursor-pointer">
                Visibile ai clienti
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvataggio..." : isEditing ? "Salva modifiche" : "Crea pacchetto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
