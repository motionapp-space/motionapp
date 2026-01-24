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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        });
      } else {
        reset({
          name: "Pacchetto 5 sessioni",
          credits_amount: 5,
          price_cents: Math.round(singleSessionPrice * 5 * 0.9), // 10% discount default
          duration_months: 3,
        });
      }
    }
  }, [open, product, singleSessionPrice, reset]);

  const creditsAmount = watch("credits_amount");
  const priceCents = watch("price_cents");

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
      description: null,
      is_active: true,
      is_visible: true,
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
            Imposta i parametri di default del pacchetto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* 1. Numero sessioni */}
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

          {/* 2. Nome */}
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

          {/* 3. Prezzo */}
          <div className="space-y-2">
            <Label>Prezzo totale (€) *</Label>
            <PriceInput
              value={priceCents}
              onChange={(cents) => setValue("price_cents", cents)}
            />
            <p className="text-sm text-muted-foreground">
              {formatCurrency(pricePerSession)}/sessione
              {discountPercent > 0 && (
                <span className="text-primary font-medium ml-2">
                  -{discountPercent}% rispetto alla lezione singola
                </span>
              )}
              {discountPercent < 0 && (
                <span className="text-destructive font-medium ml-2">
                  +{Math.abs(discountPercent)}% rispetto alla lezione singola
                </span>
              )}
            </p>
          </div>

          {/* 4. Durata */}
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

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvataggio..." : isEditing ? "Salva modifiche" : "Salva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
