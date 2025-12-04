import { useMemo } from "react";
import type { ClientAppointmentView } from "../types";
import { ChangeProposalCard } from "./ChangeProposalCard";
import { RequestedCard } from "./RequestedCard";
import { ConfirmedCard } from "./ConfirmedCard";
import { EmptyStateCard } from "./EmptyStateCard";
import { useRespondToChangeProposal } from "../hooks/useRespondToChangeProposal";

interface CurrentSituationCardProps {
  appointments: ClientAppointmentView[];
  bookingEnabled: boolean;
  onBook?: () => void;
  onViewDetail?: (appointment: ClientAppointmentView) => void;
}

type SituationType = 'change_proposed' | 'requested' | 'confirmed' | 'empty';

interface CurrentSituation {
  type: SituationType;
  data: ClientAppointmentView | null;
}

function getCurrentSituation(appointments: ClientAppointmentView[]): CurrentSituation {
  // Priorità 1: CHANGE_PROPOSED
  const changeProposed = appointments.find(a => a.status === 'CHANGE_PROPOSED');
  if (changeProposed) return { type: 'change_proposed', data: changeProposed };
  
  // Priorità 2: REQUESTED più imminente
  const requested = appointments
    .filter(a => a.status === 'REQUESTED')
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  if (requested) return { type: 'requested', data: requested };
  
  // Priorità 3: prossimo CONFIRMED futuro
  const now = new Date();
  const confirmed = appointments
    .filter(a => a.status === 'CONFIRMED' && new Date(a.startAt) > now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  if (confirmed) return { type: 'confirmed', data: confirmed };
  
  // Nessun appuntamento futuro
  return { type: 'empty', data: null };
}

export function CurrentSituationCard({ 
  appointments, 
  bookingEnabled,
  onBook,
  onViewDetail 
}: CurrentSituationCardProps) {
  const { accept, reject, isPending } = useRespondToChangeProposal();
  
  const situation = useMemo(() => getCurrentSituation(appointments), [appointments]);

  if (situation.type === 'change_proposed' && situation.data) {
    return (
      <ChangeProposalCard 
        appointment={situation.data}
        onAccept={() => accept(situation.data!.id)}
        onReject={() => reject(situation.data!.id)}
        isPending={isPending}
      />
    );
  }

  if (situation.type === 'requested' && situation.data) {
    return (
      <RequestedCard 
        appointment={situation.data}
        onClick={() => onViewDetail?.(situation.data!)}
      />
    );
  }

  if (situation.type === 'confirmed' && situation.data) {
    return (
      <ConfirmedCard 
        appointment={situation.data}
        onClick={() => onViewDetail?.(situation.data!)}
      />
    );
  }

  return (
    <EmptyStateCard 
      bookingEnabled={bookingEnabled}
      onBook={onBook}
    />
  );
}
