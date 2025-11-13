import { useState, useEffect } from "react";
import { useBookingSettingsQuery } from "@/features/bookings/hooks/useBookingSettings";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedAppointmentModal } from "./UnifiedAppointmentModal";
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

  return (
    <UnifiedAppointmentModal
      open={open}
      onOpenChange={onOpenChange}
      coachId={coachId}
      clientId={lockedClientId || prefillData?.clientId}
      lockedClientId={lockedClientId}
      durationMinutes={defaultDuration}
      event={event}
    />
  );
}
