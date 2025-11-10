import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBookingSettingsQuery } from "@/features/bookings/hooks/useBookingSettings";
import { supabase } from "@/integrations/supabase/client";
import { BookingModalSimple } from "./BookingModalSimple";
import type { EventWithClient } from "../types";

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventWithClient;
  prefillData?: {
    start: Date;
    end: Date;
    clientId?: string;
  };
  lockedClientId?: string;
  onStartSession?: (clientId: string, eventId: string, linkedPlanId?: string, linkedDayId?: string) => void;
}

export function EventModal({ 
  open, 
  onOpenChange, 
  event, 
  prefillData, 
  lockedClientId 
}: EventModalProps) {
  const { data: bookingSettings } = useBookingSettingsQuery();
  const [coachId, setCoachId] = useState<string>("");

  useEffect(() => {
    const getCoachId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCoachId(user.id);
    };
    getCoachId();
  }, []);

  const defaultDuration = bookingSettings?.slot_duration_minutes || 45;

  // Use simplified modal for new events
  if (!event) {
    return (
      <BookingModalSimple
        open={open}
        onOpenChange={onOpenChange}
        coachId={coachId}
        clientId={lockedClientId || prefillData?.clientId}
        durationMinutes={defaultDuration}
      />
    );
  }

  // Fallback for editing - to be implemented
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica appuntamento</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          La modifica degli appuntamenti sarà disponibile a breve.
        </p>
      </DialogContent>
    </Dialog>
  );
}
