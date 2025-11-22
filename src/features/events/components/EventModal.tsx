import { useState, useEffect } from "react";
import { useBookingSettingsQuery } from "@/features/bookings/hooks/useBookingSettings";
import { supabase } from "@/integrations/supabase/client";
import { CoachAppointmentModal } from "./CoachAppointmentModal";
import { ClientAppointmentModal } from "./ClientAppointmentModal";
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
  mode?: 'coach-create' | 'client-booking';
}

export function EventModal({ 
  open, 
  onOpenChange, 
  event, 
  prefillData, 
  lockedClientId,
  onStartSession,
  mode = 'coach-create'
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

  // FASE 4: Route to appropriate modal based on mode
  if (mode === 'client-booking') {
    return (
      <ClientAppointmentModal
        open={open}
        onOpenChange={onOpenChange}
        coachId={coachId}
        clientId={lockedClientId || prefillData?.clientId || ""}
        durationMinutes={defaultDuration}
      />
    );
  }

  // Coach mode - full freedom
  return (
    <CoachAppointmentModal
      open={open}
      onOpenChange={onOpenChange}
      event={event}
      prefillData={prefillData}
      lockedClientId={lockedClientId}
      onStartSession={onStartSession}
    />
  );
}
