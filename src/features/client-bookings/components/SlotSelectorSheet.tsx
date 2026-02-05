import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, CalendarDays, Loader2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useClientBookingSettings } from "../hooks/useClientBookingSettings";
import { useClientValidPackages } from "../hooks/useClientValidPackages";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaymentCoverageSection } from "./PaymentCoverageSection";
import { format, addDays, startOfDay, isSameDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useClientAvailableSlots, clientAvailableSlotsQueryKey } from "../hooks/useClientAvailableSlots";
import { useCreateBookingRequest } from "../hooks/useCreateBookingRequest";
import { cn } from "@/lib/utils";
import { ScrollAffordance } from "@/components/ui/scroll-affordance";
import type { AvailableSlot } from "../types";

type BookingStep = "SELECT_SLOT" | "CONFIRM";

interface SlotSelectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return hours === 1 ? "1 ora" : `${hours} ore`;
  }
  return `${hours}h ${remainingMins}min`;
}

export function SlotSelectorSheet({ open, onOpenChange }: SlotSelectorSheetProps) {
  const [step, setStep] = useState<BookingStep>("SELECT_SLOT");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scrollRefStep1 = useRef<HTMLDivElement>(null);
  const scrollRefStep2 = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();
  const { data: slots, isLoading } = useClientAvailableSlots(28);
  const { data: settings } = useClientBookingSettings();
  const createBooking = useCreateBookingRequest();
  
  // Fetch valid packages for selected slot (preload for step 2)
  const { data: validPackages = [], isLoading: packagesLoading } = useClientValidPackages(
    selectedSlot?.end ?? null
  );

  // Reset all state when sheet closes
  useEffect(() => {
    if (!open) {
      setStep("SELECT_SLOT");
      setSelectedSlot(null);
      setSelectedPackageId(null);
      setSubmitError(null);
    }
  }, [open]);

  // Reset package selection when slot changes
  useEffect(() => {
    setSelectedPackageId(null);
  }, [selectedSlot?.start, selectedSlot?.end]);

  // Guard rail: if selected package is no longer valid, reset
  useEffect(() => {
    if (!selectedPackageId) return;
    if (!validPackages.some(p => p.packageId === selectedPackageId)) {
      setSelectedPackageId(null);
    }
  }, [validPackages, selectedPackageId]);

  // Calculate economic choice based on packages
  const economicChoice = useMemo(() => {
    if (validPackages.length === 0) {
      return { economicType: 'single_paid' as const, packageId: null };
    }
    if (validPackages.length === 1) {
      return { economicType: 'package' as const, packageId: validPackages[0].packageId };
    }
    // 2+: use user selection or default FEFO (first in list)
    const effectivePackageId = selectedPackageId ?? validPackages[0].packageId;
    return {
      economicType: 'package' as const,
      packageId: effectivePackageId,
    };
  }, [validPackages, selectedPackageId]);

  // Generate 7 days starting from today + week offset
  const weekDates = useMemo(() => {
    const today = startOfDay(new Date());
    const daysDiff = Math.floor(
      (selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weekOffset = Math.max(0, Math.floor(daysDiff / 7));
    const startDate = addDays(today, weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  }, [selectedDate]);

  // Filter slots for selected date
  const daySlots = useMemo(() => {
    if (!slots) return [];
    return slots.filter(slot => 
      isSameDay(parseISO(slot.start), selectedDate)
    );
  }, [slots, selectedDate]);

  // Toggle slot selection
  const handleSelectSlot = (slot: AvailableSlot) => {
    if (selectedSlot?.start === slot.start) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
      setSubmitError(null);
    }
  };

  // Submit booking request with economic choice
  const handleSubmit = async () => {
    if (!selectedSlot) return;
    setSubmitError(null);
    
    try {
      await createBooking.mutateAsync({
        requestedStartAt: selectedSlot.start,
        requestedEndAt: selectedSlot.end,
        economicType: economicChoice.economicType,
        packageId: economicChoice.packageId ?? undefined,
      });
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "";
      
      if (
        errorMessage.toLowerCase().includes("not available") || 
        errorMessage.toLowerCase().includes("non disponibile") ||
        errorMessage.includes("SLOT_TAKEN")
      ) {
        setSubmitError("Questo orario non è più disponibile. Seleziona un altro.");
        setSelectedSlot(null);
        setStep("SELECT_SLOT");
        queryClient.invalidateQueries({ queryKey: clientAvailableSlotsQueryKey(28) });
      } else {
        setSubmitError("Errore di connessione. Riprova.");
      }
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'next' ? 7 : -7;
    const newDate = addDays(selectedDate, days);
    const today = startOfDay(new Date());
    if (newDate >= today) {
      setSelectedDate(newDate);
    }
  };

  const canGoPrev = selectedDate > startOfDay(new Date());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl flex flex-col p-0">
        
        {/* ============ STEP 1: SELECT SLOT ============ */}
        {step === "SELECT_SLOT" && (
          <>
            {/* Header */}
            <SheetHeader className="px-4 pt-4 pb-3 border-b flex-shrink-0">
              <SheetTitle className="text-center">Prenota appuntamento</SheetTitle>
              {settings?.slotDurationMinutes && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      Durata: {formatDuration(settings.slotDurationMinutes)}
                    </span>
                  </div>
                </div>
              )}
            </SheetHeader>

            {/* Scrollable Content */}
            <div ref={scrollRefStep1} className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              {/* Week navigator */}
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigateWeek('prev')}
                  disabled={!canGoPrev}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm font-medium">
                  {format(weekDates[0], "d MMM", { locale: it })} - {format(weekDates[6], "d MMM", { locale: it })}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigateWeek('next')}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Date strip */}
              <div className="grid grid-cols-7 gap-1 pb-4">
                {weekDates.map((date) => {
                  const isSelected = isSameDay(date, selectedDate);
                  const hasSlots = slots?.some(s => isSameDay(parseISO(s.start), date));
                  
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "flex flex-col items-center py-2 px-1 rounded-lg transition-colors",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : hasSlots 
                            ? "bg-accent hover:bg-accent/80" 
                            : "opacity-50"
                      )}
                    >
                      <span className="text-[10px] uppercase">
                        {format(date, "EEE", { locale: it })}
                      </span>
                      <span className="text-base font-semibold">
                        {format(date, "d")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Slots section */}
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Orari disponibili per {format(selectedDate, "EEEE d MMMM", { locale: it })}
              </h3>

              {isLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : daySlots.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nessun orario disponibile per questa data
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {daySlots.map((slot) => {
                    const isSelected = selectedSlot?.start === slot.start;
                    return (
                      <Button
                        key={slot.start}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "h-12 transition-all",
                          isSelected && "ring-2 ring-primary ring-offset-2"
                        )}
                        onClick={() => handleSelectSlot(slot)}
                      >
                        {format(parseISO(slot.start), "HH:mm")}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Step 1 */}
            <div className="sticky bottom-0 bg-background flex-shrink-0 relative">
              <ScrollAffordance targetRef={scrollRefStep1} placement="top" className="absolute -top-8 left-0 right-0" />
              <div className="px-4 pt-3 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button
                  className="w-full h-12"
                  disabled={!selectedSlot}
                  onClick={() => setStep("CONFIRM")}
                >
                  {selectedSlot ? "Continua" : "Seleziona un orario"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ============ STEP 2: CONFIRM ============ */}
        {step === "CONFIRM" && selectedSlot && (
          <>
            {/* Header with back button */}
            <div className="px-4 pt-4 pb-3 border-b flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setStep("SELECT_SLOT")}
                className="gap-1 -ml-2 mb-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Cambia orario
              </Button>
              <h2 className="text-lg font-semibold text-center">
                Conferma appuntamento
              </h2>
            </div>

              {/* Content - scrollable */}
              <div ref={scrollRefStep2} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6">
              {/* Slot summary card (read-only) */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-medium capitalize">
                      {format(parseISO(selectedSlot.start), "EEEE d MMMM yyyy", { locale: it })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>
                      {format(parseISO(selectedSlot.start), "HH:mm")} – {format(parseISO(selectedSlot.end), "HH:mm")}
                      {settings?.slotDurationMinutes && (
                        <span className="text-muted-foreground ml-2">
                          ({formatDuration(settings.slotDurationMinutes)})
                        </span>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment/Coverage Section - ALWAYS VISIBLE */}
              <PaymentCoverageSection
                packages={validPackages}
                isLoading={packagesLoading}
                selectedPackageId={economicChoice.packageId}
                onSelectPackage={(id) => setSelectedPackageId(id)}
              />
            </div>

            {/* Footer Step 2 */}
            <div className="sticky bottom-0 bg-background flex-shrink-0 relative">
              <ScrollAffordance targetRef={scrollRefStep2} placement="top" className="absolute -top-8 left-0 right-0" />
              <div className="px-4 pt-3 border-t space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {/* Microcopy */}
                <p className="text-xs text-muted-foreground text-center">
                  Invieremo la richiesta al coach. Riceverai una notifica alla conferma.
                </p>
                
                {/* Error inline */}
                {submitError && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{submitError}</AlertDescription>
                  </Alert>
                )}
                
                {/* CTA Button */}
                <Button
                  className="w-full h-12"
                  disabled={createBooking.isPending}
                  onClick={handleSubmit}
                >
                  {createBooking.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Invio richiesta...
                    </>
                  ) : (
                    "Richiedi appuntamento"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

      </SheetContent>
    </Sheet>
  );
}
