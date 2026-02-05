import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { format, addMonths } from "date-fns";
import { Pencil } from "lucide-react";
import { it } from "date-fns/locale";
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
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreatePackageInput } from "../types";
import { formatCurrency } from "../utils/kpi";
import { useProducts } from "@/features/products/hooks/useProducts";
import type { Product } from "@/features/products/types";

interface PackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachClientId: string;
  onSubmit: (data: CreatePackageInput) => void;
  isLoading?: boolean;
}

const CUSTOM_VALUE = "custom";

export function PackageDialog({
  open,
  onOpenChange,
  coachClientId,
  onSubmit,
  isLoading,
}: PackageDialogProps) {
  const { data: products } = useProducts();
  
  // Filter active visible packages and single session
  const packageProducts = useMemo(() => 
    products?.filter(p => p.type === "session_pack" && p.is_active && p.is_visible) || [],
    [products]
  );
  const singleSession = products?.find(p => p.type === "single_session");
  const singleSessionPrice = singleSession?.price_cents || 5000;

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreatePackageInput>({
    defaultValues: {
      coach_client_id: coachClientId,
      total_sessions: 5,
      name: "Pacchetto 5 sessioni",
      duration_months: 3,
    },
  });

  // Set default selection when dialog opens
  useEffect(() => {
    if (open) {
      setIsCustom(false);
      // Select first package by default
      const firstPackage = packageProducts[0];
      if (firstPackage) {
        setSelectedProductId(firstPackage.id);
        applyProductToForm(firstPackage);
      } else {
        // No packages, go to custom mode
        setIsCustom(true);
        setSelectedProductId(CUSTOM_VALUE);
        reset({
          coach_client_id: coachClientId,
          total_sessions: 5,
          name: "Pacchetto 5 sessioni",
          duration_months: 3,
          price_total_cents: Math.round(singleSessionPrice * 5 * 0.9),
        });
      }
    }
  }, [open, packageProducts.length, coachClientId, singleSessionPrice]);

  const applyProductToForm = (product: Product) => {
    reset({
      coach_client_id: coachClientId,
      total_sessions: product.credits_amount,
      name: product.name,
      duration_months: product.duration_months,
      price_total_cents: product.price_cents,
    });
  };

  const handleProductChange = (value: string) => {
    setSelectedProductId(value);
    
    if (value === CUSTOM_VALUE) {
      setIsCustom(true);
      // Keep current values but allow editing
      return;
    }
    
    setIsCustom(false);
    const product = packageProducts.find(p => p.id === value);
    if (product) {
      applyProductToForm(product);
    }
  };

  const handleCustomSessionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sessions = parseInt(e.target.value) || 1;
    setValue("total_sessions", sessions);
    setValue("name", `Pacchetto ${sessions} sessioni`);
    // Suggest price with 10% discount
    setValue("price_total_cents", Math.round(singleSessionPrice * sessions * 0.9));
    // Suggest duration
    setValue("duration_months", Math.max(1, Math.ceil(sessions / 3)));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cents = Math.round(parseFloat(e.target.value || "0") * 100);
    setValue("price_total_cents", cents);
  };

  const handleDurationChange = (value: string) => {
    setValue("duration_months", parseInt(value));
  };

  const onSubmitForm = (data: CreatePackageInput) => {
    const cleanedData = {
      ...data,
      expires_at: data.expires_at && data.expires_at.trim() !== '' ? data.expires_at : null,
      payment_method: data.payment_method && data.payment_method.trim() !== '' ? data.payment_method : null,
      notes_internal: data.notes_internal && data.notes_internal.trim() !== '' ? data.notes_internal : null,
    };
    onSubmit(cleanedData);
    reset();
  };

  const priceValue = watch("price_total_cents");
  const totalSessions = watch("total_sessions");
  const durationValue = watch("duration_months");

  const pricePerSession = priceValue && totalSessions 
    ? formatCurrency(priceValue / totalSessions) 
    : "N/D";

  const expirationDate = durationValue 
    ? format(addMonths(new Date(), durationValue), "d MMMM yyyy", { locale: it })
    : "";

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
          {/* Product Selection */}
          <div className="space-y-2">
            <Label>Pacchetto *</Label>
            <Select
              value={selectedProductId}
              onValueChange={handleProductChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un pacchetto" />
              </SelectTrigger>
              <SelectContent>
                {packageProducts.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} • {formatCurrency(product.price_cents)}
                  </SelectItem>
                ))}
                {packageProducts.length > 0 && <SelectSeparator />}
                <SelectItem value={CUSTOM_VALUE}>
                  <span className="flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    Personalizzato...
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Sessions Input (only in custom mode) */}
          {isCustom && (
            <div className="space-y-2">
              <Label htmlFor="custom_sessions">Numero di sessioni *</Label>
              <Input
                id="custom_sessions"
                type="number"
                min="1"
                max="100"
                value={totalSessions}
                onChange={handleCustomSessionsChange}
              />
            </div>
          )}

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
              placeholder="Es. 10 lezioni individuali"
              readOnly={!isCustom}
              className={!isCustom ? "bg-muted" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Price and Price per Session */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Prezzo totale (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={priceValue != null ? (priceValue / 100).toFixed(2) : ""}
                onChange={handlePriceChange}
                placeholder="0.00"
                readOnly={!isCustom}
                className={!isCustom ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Prezzo unitario</Label>
              <Input value={pricePerSession} disabled />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration_months">Durata</Label>
            <Select
              value={durationValue?.toString() || "3"}
              onValueChange={handleDurationChange}
              disabled={!isCustom}
            >
              <SelectTrigger className={!isCustom ? "bg-muted" : ""}>
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
            <p className="text-xs text-muted-foreground">
              Scadrà il <span className="font-medium">{expirationDate}</span>
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">Metodo di pagamento</Label>
            <Input
              id="payment_method"
              {...register("payment_method")}
              placeholder="Es. Contanti, Bonifico, Carta"
            />
          </div>

          {/* Internal Notes */}
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
