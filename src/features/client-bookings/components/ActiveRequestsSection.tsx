import type { ClientAppointmentView } from "../types";
import { CounterProposalCard } from "./CounterProposalCard";
import { PendingRequestCard } from "./PendingRequestCard";

interface ActiveRequestsSectionProps {
  requests: ClientAppointmentView[];
  onAcceptCounter: (id: string) => void;
  onRejectCounter: (id: string) => void;
  onCancelRequest: (id: string) => void;
  isLoading?: boolean;
}

export function ActiveRequestsSection({ 
  requests, 
  onAcceptCounter, 
  onRejectCounter,
  onCancelRequest,
  isLoading 
}: ActiveRequestsSectionProps) {
  if (requests.length === 0) return null;

  return (
    <section>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
        Richieste in corso
      </p>
      <div className="space-y-3">
        {requests.map((request) => {
          if (request.status === 'COUNTER_PROPOSAL') {
            return (
              <CounterProposalCard
                key={request.id}
                request={request}
                onAccept={() => onAcceptCounter(request.id)}
                onReject={() => onRejectCounter(request.id)}
                isLoading={isLoading}
              />
            );
          }
          
          return (
            <PendingRequestCard
              key={request.id}
              request={request}
              onCancel={() => onCancelRequest(request.id)}
              isLoading={isLoading}
            />
          );
        })}
      </div>
    </section>
  );
}
