/** @jsxImportSource https://esm.sh/react@18.3.1 */
import React from 'https://esm.sh/react@18.3.1';
import { Layout } from '../shared/layout.tsx';
import { Heading } from '../shared/heading.tsx';
import { Text } from '../shared/text.tsx';
import { InfoBox } from '../shared/info-box.tsx';
import type { AppointmentCounterProposedTemplateData, EmailTemplate } from '../types.ts';
import { formatDateTime, formatTimeRange } from '../helpers.ts';

/**
 * Template email per controproposta ricevuta.
 * Inviato al cliente quando il coach propone un orario alternativo.
 */
function CounterProposedClientEmail(data: AppointmentCounterProposedTemplateData) {
  return (
    <Layout preview={`${data.coach_name} ha proposto un nuovo orario`}>
      <Heading>Nuova proposta di orario</Heading>
      <Text>
        Ciao {data.client_name},
      </Text>
      <Text>
        {data.coach_name} non può confermare l'orario che avevi richiesto, 
        ma ti propone un'alternativa:
      </Text>
      <InfoBox>
        <strong>❌ Richiesta originale:</strong>
        <br />
        {formatDateTime(data.original_date)}
        <br />
        {formatTimeRange(data.original_date, data.original_end)}
      </InfoBox>
      <InfoBox variant="highlight">
        <strong>✅ Nuova proposta:</strong>
        <br />
        {formatDateTime(data.proposed_date)}
        <br />
        {formatTimeRange(data.proposed_date, data.proposed_end)}
      </InfoBox>
      {data.notes && (
        <>
          <Text>
            <strong>Messaggio dal coach:</strong>
          </Text>
          <Text muted>{data.notes}</Text>
        </>
      )}
      <Text>
        Accedi a Studio AI per accettare o rifiutare questa proposta.
      </Text>
    </Layout>
  );
}

function subject(data: AppointmentCounterProposedTemplateData): string {
  return `${data.coach_name} ti propone un nuovo orario`;
}

export const counterProposedClientTemplate: EmailTemplate<AppointmentCounterProposedTemplateData> = {
  component: CounterProposedClientEmail,
  subject,
  requiredFields: [
    'appointment_date', 
    'appointment_end', 
    'coach_name', 
    'client_name', 
    'actor_role',
    'original_date',
    'original_end',
    'proposed_date',
    'proposed_end',
  ],
};
