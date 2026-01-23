import { useState, useEffect } from "react";
import { useBookingSettingsQuery } from "@/features/bookings/hooks/useBookingSettings";
import { supabase } from "@/integrations/supabase/client";
import { EventEditorModal } from "./EventEditorModal";
import { ClientAppointmentModal } from "./ClientAppointmentModal";
import type { EventWithClient } from "../types";

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventWithClient;
  prefillData?: {
    start?: Date;
    end?: Date;
    clientId?: string;
  };
  lockedClientId?: string;
  onStartSession?: (clientId: string, eventId: string, linkedPlanId?: string, linkedDayId?: string) => void;
  mode?: 'coach-create' | 'client-booking';
  onDeleteRequest?: (eventId: string, eventTitle: string, seriesId?: string | null) => void;
}

export function EventModal({ 
  open, 
  onOpenChange, 
  event, 
  prefillData, 
  lockedClientId,
  onStartSession,
  mode = 'coach-create',
  onDeleteRequest
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

  // Coach mode - use EventEditorModal
  return (
    <EventEditorModal
      mode={event ? 'edit' : 'new'}
      open={open}
      onOpenChange={onOpenChange}
      coachId={coachId}
      event={event}
      initialDate={prefillData?.start}
      initialStartTime={prefillData?.start}
      initialEndTime={prefillData?.end}
      lockedClientId={lockedClientId}
      onStartSession={onStartSession}
      onDeleteRequest={(eventId, title, seriesId) => onDeleteRequest?.(eventId, title, seriesId)}
    />
  );
}
