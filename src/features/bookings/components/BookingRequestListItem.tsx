import { useState, useEffect, useCallback } from "react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { it } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BookingRequestWithClient, AvailableSlot } from "../types";

interface BookingRequestListItemProps {
  request: BookingRequestWithClient;
  onApprove: () => Promise<void>;
  onDecline: () => Promise<void>;
  onCounterPropose: (startAt: string, endAt: string) => Promise<void>;
  loadAlternatives: () => Promise<AvailableSlot[]>;
}

export function BookingRequestListItem({
  request,
  onApprove,
  onDecline,
  onCounterPropose,
  loadAlternatives,
}: BookingRequestListItemProps) {
  const isPending = request.status === "PENDING";
  const isCounterProposed = request.status === "COUNTER_PROPOSED";

  // Local state
  const [confirmingDecline, setConfirmingDecline] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<AvailableSlot[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard handler for Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConfirmingDecline(false);
        setShowAlternatives(false);
      }
    };
    if (confirmingDecline || showAlternatives) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [confirmingDecline, showAlternatives]);

  // Lazy load alternatives
  const handleOpenAlternatives = useCallback(async () => {
    if (!showAlternatives && alternatives.length === 0) {
      setLoadingAlternatives(true);
      try {
        const slots = await loadAlternatives();
        setAlternatives(slots);
      } finally {
        setLoadingAlternatives(false);
      }
    }
    setShowAlternatives(!showAlternatives);
    setConfirmingDecline(false);
  }, [showAlternatives, alternatives.length, loadAlternatives]);

  // Action handlers
  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    try {
      await onDecline();
    } finally {
      setIsSubmitting(false);
      setConfirmingDecline(false);
    }
  };

  const handleCounterPropose = async () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    try {
      await onCounterPropose(selectedSlot.start, selectedSlot.end);
    } finally {
      setIsSubmitting(false);
      setShowAlternatives(false);
      setSelectedSlot(null);
    }
  };

  // Format helpers
  const requestedStart = parseISO(request.requested_start_at);
  const requestedEnd = parseISO(request.requested_end_at);
  const duration = differenceInMinutes(requestedEnd, requestedStart);

  const counterStart = request.counter_proposal_start_at
    ? parseISO(request.counter_proposal_start_at)
    : null;

  return (
    <div
      className={cn(
        "bg-background border border-border/50 rounded-lg",
        "px-4 py-3",
        "hover:border-border transition-colors duration-150"
      )}
    >
      {/* Main content */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          {/* Row 1: Date/time (primary - WHEN) */}
          <div className="text-sm font-medium text-foreground">
            {format(requestedStart, "EEE d MMMM · HH:mm", { locale: it })}–
            {format(requestedEnd, "HH:mm", { locale: it })}
          </div>

          {/* Row 2: Client + duration (secondary - WHO) */}
          <div className="text-sm text-muted-foreground">
            {request.client_name} · {duration} min
          </div>

          {/* Counter proposal info */}
          {isCounterProposed && counterStart && (
            <div className="mt-2 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Proposta inviata:</span>
                <span className="text-sm text-foreground">
                  {format(counterStart, "EEE d MMM · HH:mm", { locale: it })}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Richiesta originale:{" "}
                {format(requestedStart, "d MMM HH:mm", { locale: it })}
              </div>
            </div>
          )}
        </div>

        {/* Badge */}
        <Badge variant="outline" className="shrink-0">
          {isPending ? "In attesa" : "In attesa cliente"}
        </Badge>
      </div>

      {/* Actions for PENDING requests */}
      {isPending && (
        <div className="mt-3">
          <AnimatePresence mode="wait">
            {confirmingDecline ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="flex items-center gap-2 text-sm"
              >
                <span className="text-muted-foreground">
                  Rifiutare la richiesta?
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setConfirmingDecline(false)}
                  disabled={isSubmitting}
                >
                  Annulla
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 px-2"
                  onClick={handleDecline}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Rifiuta"
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="flex items-center gap-2 flex-wrap"
              >
                <Button
                  size="sm"
                  className="h-7"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Approva
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7"
                  onClick={handleOpenAlternatives}
                  disabled={isSubmitting}
                >
                  Proponi altro orario
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-destructive hover:text-destructive"
                  onClick={() => {
                    setConfirmingDecline(true);
                    setShowAlternatives(false);
                  }}
                  disabled={isSubmitting}
                >
                  Rifiuta
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Alternatives accordion */}
      <AnimatePresence>
        {showAlternatives && isPending && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 pt-3 mt-3 space-y-3">
              <p className="text-sm font-medium">Orari alternativi suggeriti</p>

              {loadingAlternatives ? (
                <div className="py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Caricamento orari...
                  </span>
                </div>
              ) : alternatives.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Nessun orario alternativo disponibile nei prossimi giorni.
                </p>
              ) : (
                <div className="space-y-2">
                  {alternatives.slice(0, 5).map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "w-full text-left p-2 rounded-lg border text-sm transition-colors",
                        selectedSlot?.start === slot.start
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-primary/50"
                      )}
                    >
                      {format(parseISO(slot.start), "EEEE d MMMM · HH:mm", {
                        locale: it,
                      })}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAlternatives(false);
                    setSelectedSlot(null);
                  }}
                  disabled={isSubmitting}
                >
                  Annulla
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedSlot || isSubmitting}
                  onClick={handleCounterPropose}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Invia proposta
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
